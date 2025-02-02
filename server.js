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

app.get('/reset-password', (_req, res) => {
    res.text('not implemented yet');
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

// linked student route
app.get('/linked-student-id', authenticateUser, async (req, res) => {
    const userId = req.user.id // get the user id

    try {
        const result = await pool.query('SELECT linked_student_id FROM Users WHERE id = $1', [userId]);

        if (!result.rows) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ id: result.rows[0].linked_student_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// student achievements route
app.get('/student/achievements/:studentId', authenticateUser, async (req, res) => {
    const studentId = req.params.studentId // get the user id

    try {

        const result = await pool.query(`SELECT 
                                            u.name AS name,
                                            sa.school_name,
                                            sa.achievements
                                        FROM 
                                            StudentAchievements sa
                                        JOIN 
                                            users u ON sa.student_id = u.id
                                        WHERE 
                                            sa.student_id = $1
                                        `, [studentId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
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
