const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const pool = require('./config/db');
const jwt = require('jsonwebtoken');

const app = express();

// middlewares
app.use(express.static('public'));
app.set('view engine', 'pug');
app.use(bodyParser.json());

// middleware to authenticate user and get user data
const authenticateUser = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer token

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        req.user = result.rows[0]; // add user data to request
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

// auth routes
app.use('/auth', authRoutes);

// home/login route
app.get('/', (_req, res) => {
    res.render('login');
});

app.get('/dashboard', (_req, res) => {
    res.render('dashboard');
});

// school dashboard route
app.get('/school', authenticateUser, (req, res) => {
    if (req.user.role !== 'School') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    res.render('school', { user: req.user });
});

// parent dashboard route
app.get('/parent', authenticateUser, (req, res) => {
    if (req.user.role !== 'Parent') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    res.render('parent', { user: req.user });
});

// student dashboard route
app.get('/student', authenticateUser, (req, res) => {
    if (req.user.role !== 'Student') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    res.render('student', { user: req.user });
});

// start server
const PORT = process.env.PORT || 3000;
const colors = {
    skyblue: "\x1b[38;5;45m",
    reset: "\x1b[0m"
}

app.listen(PORT, () => {
    console.log(`⑆ app running on ${colors.skyblue}http://localhost:${PORT}/${colors.reset}`);
});
