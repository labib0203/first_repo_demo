const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    await connection.query('USE careconnect');
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables:', rows.map(r => Object.values(r)[0]));

    // Check doctor_leaves structure
    try {
        const [dRows] = await connection.query('DESCRIBE doctor_leaves');
        console.log('doctor_leaves columns:', dRows.map(r => r.Field));
    } catch (e) {
        console.log('doctor_leaves error:', e.message);
    }

    await connection.end();
}

check();
