const pool = require('./src/config/database');

async function checkTables() {
    try {
        console.log('=== CHECKING TABLES ===\n');
        
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%role%' OR table_name LIKE '%permission%')
            ORDER BY table_name
        `);
        
        console.log('Role/Permission related tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables();