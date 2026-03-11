const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true,
    });

    console.log('Connected to MySQL...');

    try {
        async function executeSqlFile(filePath) {
            console.log(`⏳ Applying ${path.basename(filePath)}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            // Remove DELIMITER lines and split by // or $$ or ;
            const blocks = content
                .split(/DELIMITER\s+\/\/|DELIMITER\s+\$\$|DELIMITER\s+;|\/\/|\$\$/gi)
                .map(block => block.trim())
                .filter(block => block.length > 0);

            for (let block of blocks) {
                try {
                    await connection.query(block);
                } catch (e) {
                    // Ignore common non-critical errors
                    if (!e.message.includes('already exists') && 
                        !e.message.includes('Duplicate') && 
                        !e.message.includes('Unknown column') &&
                        !e.message.includes('Unknown table') &&
                        !e.message.includes('doesn\'t exist')) {
                        console.warn(`⚠️ Warning in ${path.basename(filePath)}:`, e.message.substring(0, 100));
                    }
                }
            }
        }

        // 1. Run Schema (Drops DB and Recreates)
        console.log('⏳ Creating Schema...');
        const schemaSql = fs.readFileSync(path.join(__dirname, '../database/01_schema.sql'), 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Schema created.');

        await connection.query(`USE careconnect;`);

        // Sequential execution of all database files
        const files = [
            '02_procedures_triggers.sql',
            '03_views_indexes.sql',
            '04_seed.sql',
            '05_post_seed_triggers.sql',
            '06_advanced_features.sql',
            '07_analytics.sql',
            '08_discharge_procedure.sql',
            '09_doctor_leaves.sql',
            '10_update_availability.sql',
            '11_consultation_procedures.sql',
            '12_staff_management.sql',
            '13_staff_seed.sql',
            '14_leaves_management.sql',
            '15_fix_doctor_slots.sql',
            '16_extra_licenses.sql',
            '17_fix_slots_display.sql',
            '18_fix_leave_availability.sql',
            '19_add_slots_message.sql',
            '20_add_pharmacist_user.sql',
            '21_add_pathologist_role.sql',
            '20_get_earnings_over_time.sql',
            '22_admission_fixes.sql',
            '23_auto_financial_reports.sql'

        ];

        for (const file of files) {
            await executeSqlFile(path.join(__dirname, `../database/${file}`));
        }

        console.log('\n✨ Database Setup Complete!');

    } catch (err) {
        console.error('❌ Setup failed:', err);
    } finally {
        await connection.end();
    }
}

seed();
