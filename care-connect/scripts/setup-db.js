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
        // 1. Run Schema (Drops DB and Recreates)
        const schemaSql = fs.readFileSync(path.join(__dirname, '../database/01_schema.sql'), 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Schema created.');

        // 2. Run Procedures/Triggers
        // Note: The driver doesn't support DELIMITER syntax. We need to manually split logic or execute blocks.
        // For simplicity in this script, we will define the procedures directly here to avoid parsing complex SQL files with delimiters.
        // Alternatively, we strip delimiters.

        await connection.query(`USE careconnect;`);

        // We will read the file but we need to remove DELIMITER lines and split by 'END //' or similar if we want to parse.
        // However, it's safer to just hardcode the critical procedures here for the runner script to ensure they work.
        // or just run the file content if we remove DELIMITER keywords and split properly.

        // Let's try reading the file and stripping DELIMITER lines, then splitting by '//'
        const procSqlFile = fs.readFileSync(path.join(__dirname, '../database/02_procedures_triggers.sql'), 'utf8');
        const procBlocks = procSqlFile
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of procBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue; // Skip USE
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing block:', block.substring(0, 50) + '...', e.message);
            }
        }
        console.log('✅ Procedures & Triggers created.');

        // 3. Views
        const viewsSql = fs.readFileSync(path.join(__dirname, '../database/03_views_indexes.sql'), 'utf8');
        await connection.query(viewsSql);
        console.log('✅ Views & Indexes created.');

        // 4. Seed Data
        const seedSql = fs.readFileSync(path.join(__dirname, '../database/04_seed.sql'), 'utf8');
        await connection.query(seedSql);
        console.log('✅ Seed Data inserted.');

        // 4.2 Post-Seed Triggers
        console.log('⏳ Applying Post-Seed Triggers...');
        const postSeedSql = fs.readFileSync(path.join(__dirname, '../database/05_post_seed_triggers.sql'), 'utf8');
        const postSeedBlocks = postSeedSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of postSeedBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing post-seed block:', e.message);
            }
        }
        console.log('✅ Post-Seed Triggers created.');

        // 4.5 Analytics
        console.log('⏳ Applying Analytics Procedures...');
        const analyticsSql = fs.readFileSync(path.join(__dirname, '../database/07_analytics.sql'), 'utf8');
        const analyticsBlocks = analyticsSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of analyticsBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing analytics block:', e.message);
            }
        }
        console.log('✅ Analytics Procedures created.');

        // 5. Advanced Features (Splitting logic needed for DELIMITER)
        console.log('⏳ Applying Advanced Features (Partitioning, Events, Cursors)...');
        const advSqlFile = fs.readFileSync(path.join(__dirname, '../database/06_advanced_features.sql'), 'utf8');
        // Simple split by // for procedures, but the file mixes standard queries and delimiters.
        // We will attempt to run it block by block or use a smarter split.
        // For this specific file, we have standard queries then DELIMITER // block then standard queries.
        // Let's use the same cleaning logic as procedures.
        const advBlocks = advSqlFile
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of advBlocks) {
            if (!block) continue;
            // Further split by semicolon if it's not a procedure block? 
            // Actually, connection.query with multipleStatements: true can handle standard SQLs separated by ; 
            // BUT mixing them with CREATE PROCEDURE in the same call might be tricky if not parsed right.
            // Let's rely on the fact that our split by // captures the big procedure, 
            // and the other parts are potentially multiple statements.
            try {
                await connection.query(block);
            } catch (e) {
                // Ignore "Table already exists" kind of errors if appropriate, but print others
                console.error('Warning in Advanced Features:', e.message);
            }
        }
        console.log('✅ Advanced Features Applied.');

        // 6. Discharge Procedure
        console.log('⏳ Applying Discharge Procedure...');
        const dischargeSql = fs.readFileSync(path.join(__dirname, '../database/08_discharge_procedure.sql'), 'utf8');
        const dischargeBlocks = dischargeSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of dischargeBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing discharge block:', e.message);
            }
        }
        console.log('✅ Discharge Procedure created.');

        // 7. Doctor Leaves
        console.log('⏳ Applying Doctor Leaves...');
        const leavesSql = fs.readFileSync(path.join(__dirname, '../database/09_doctor_leaves.sql'), 'utf8');
        const leavesBlocks = leavesSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of leavesBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing leaves block:', e.message);
            }
        }
        console.log('✅ Doctor Leaves created.');

        // 8. Update Availability Functions
        console.log('⏳ Updating Availability Functions...');
        const availabilitySql = fs.readFileSync(path.join(__dirname, '../database/10_update_availability.sql'), 'utf8');
        const availabilityBlocks = availabilitySql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of availabilityBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing availability block:', e.message);
            }
        }
        console.log('✅ Availability Functions updated.');

        // 9. Consultation Procedures
        console.log('⏳ Applying Consultation Procedures...');
        const consultationSql = fs.readFileSync(path.join(__dirname, '../database/11_consultation_procedures.sql'), 'utf8');
        const consultationBlocks = consultationSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of consultationBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing consultation block:', e.message);
            }
        }
        console.log('✅ Consultation Procedures created.');

        // 10. Staff Management
        console.log('⏳ Applying Staff Management...');
        const staffSql = fs.readFileSync(path.join(__dirname, '../database/12_staff_management.sql'), 'utf8');
        const staffBlocks = staffSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of staffBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing staff block:', e.message);
            }
        }
        console.log('✅ Staff Management created.');

        // 11. Staff Seed Data
        console.log('⏳ Seeding Staff Data...');
        const staffSeedSql = fs.readFileSync(path.join(__dirname, '../database/13_staff_seed.sql'), 'utf8');
        const staffSeedBlocks = staffSeedSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of staffSeedBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error seeding staff:', e.message);
            }
        }
        console.log('✅ Staff Data seeded.');

        // 12. Leaves Management (Doctors & Staff)
        console.log('⏳ Applying Leaves Management...');
        const leavesMgmtSql = fs.readFileSync(path.join(__dirname, '../database/14_leaves_management.sql'), 'utf8');
        const leavesMgmtBlocks = leavesMgmtSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of leavesMgmtBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing leaves mgmt block:', e.message);
            }
        }
        console.log('✅ Leaves Management Applied.');

        // 13. Fix Doctor Slots (Availability Check)
        console.log('⏳ Applying Availability Slots Fix...');
        const slotFixSql = fs.readFileSync(path.join(__dirname, '../database/15_fix_doctor_slots.sql'), 'utf8');
        const slotFixBlocks = slotFixSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of slotFixBlocks) {
            // if (block.toLowerCase().startsWith('use')) continue;
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing slot fix block:', e.message);
            }
        }
        console.log('✅ Availability Slots Fix Applied.');

        // 14. Extra Licenses
        console.log('⏳ Applying Extra Licenses...');
        const licensesSql = fs.readFileSync(path.join(__dirname, '../database/16_extra_licenses.sql'), 'utf8');
        // Simple insert, no delimiters needed usually but for consistency with others:
        // (Use simple query if no delimiters, but the block logic handles it)
        try {
            await connection.query(licensesSql);
        } catch (e) {
            // Ignore duplicate entry if re-running
            if (!e.message.includes('Duplicate entry')) {
                console.error('Error executing extra licenses:', e.message);
            }
        }
        console.log('✅ Extra Licenses Applied.');

        // 15. Fix Slots Display
        console.log('⏳ Applying Slots Fix...');
        const slotsFixSql = fs.readFileSync(path.join(__dirname, '../database/17_fix_slots_display.sql'), 'utf8');
        const slotsFixBlocks = slotsFixSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of slotsFixBlocks) {
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing slots fix block:', e.message);
            }
        }
        console.log('✅ Slots Fix Applied.');

        // 16. Fix Leave Availability (Custom Fix 1)
        console.log('⏳ Applying Leave Availability Fix...');
        const leaveFixSql = fs.readFileSync(path.join(__dirname, '../database/18_fix_leave_availability.sql'), 'utf8');
        const leaveFixBlocks = leaveFixSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of leaveFixBlocks) {
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing leave fix block:', e.message);
            }
        }
        console.log('✅ Leave Availability Fix Applied.');

        // 17. Add Slots Message (Custom Fix 2)
        console.log('⏳ Applying Slots Message Update...');
        const msgFixSql = fs.readFileSync(path.join(__dirname, '../database/19_add_slots_message.sql'), 'utf8');
        const msgFixBlocks = msgFixSql
            .replace(/DELIMITER \/\//g, '')
            .replace(/DELIMITER ;/g, '')
            .split('//')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const block of msgFixBlocks) {
            try {
                await connection.query(block);
            } catch (e) {
                console.error('Error executing slots message block:', e.message);
            }
        }
        console.log('✅ Slots Message Update Applied.');

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await connection.end();
    }
}

seed();
