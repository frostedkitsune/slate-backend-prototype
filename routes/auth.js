const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Login Handler
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // verify credentials
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // create JWT token
        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // create refresh token
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // store refresh token in the database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Set expiration for 7 days

        await pool.query('INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Refresh Token Handler
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        // verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const userId = decoded.id;

        const result = await pool.query('SELECT * FROM sessions WHERE user_id = $1 AND refresh_token = $2', [userId, refreshToken]);
        const tokenEntry = result.rows[0];

        if (!tokenEntry) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // create a new access token
        const newRefreshToken = jwt.sign({ id: userId, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // invalidate the used refresh token
        await pool.query('DELETE FROM sessions WHERE id = $1', [tokenEntry.id]);

        res.json({ newRefreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout Handler
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        // verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const userId = decoded.id;

        // invalidate the refresh token by deleting it from the database
        await pool.query('DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2', [userId, refreshToken]);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
