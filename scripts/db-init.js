const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.DB_PORT,
});

async function initializeDB() {
    try {
        const connection = await client.connect();
        console.log('Connected to PostgreSQL server');

        await client.query(`
            CREATE TABLE Users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('School', 'Parent', 'Student')) NOT NULL,
                linked_student_id INT,
                FOREIGN KEY (linked_student_id) REFERENCES Users(id) ON DELETE SET NULL
            );
        `);
        await client.query(`
            CREATE TABLE StudentAchievements (
                student_id INT PRIMARY KEY,
                school_name VARCHAR(255) NOT NULL,
                achievements TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
            );
        `);
        await client.query(`
            CREATE TABLE Sessions (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES Users(id),
                refresh_token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL
            );
        `);
        console.log('Created necesary tables');

        let passwords = ['123456', '654321', '987654'];
        passwords = passwords.map((password) => {
            return bcrypt.hashSync(password, 5);
        })

        console.log("Inserting mock data...");
        const userInsertRes = await client.query(`
            INSERT INTO Users (Name, Email, Password, Role, Linked_Student_ID) VALUES
            ('ABC School', 'school@slate.com', '${passwords[0]}', 'School', NULL),
            ('Rahul Gupta', 'parent@slate.com', '${passwords[1]}', 'Parent', 3),
            ('Riya Sharma', 'student@slate.com', '${passwords[2]}', 'Student', 3);
        `);
        console.log("Table: Users | Affected: " + userInsertRes.rowCount + " rows");
        const achievementInsertRes = await client.query(`
            INSERT INTO StudentAchievements (student_id, school_name, achievements) VALUES
            (3, 'ABC School', 'Science Olympiad Winner');
        `);
        console.log("Table: StudentAchievements | Affected " + achievementInsertRes.rowCount + " rows");
        console.log("\x1b[38;5;10mDone.\x1b[0m");
    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } finally {
        // Clean up on completion
        await client.end();
    }
}

initializeDB();


