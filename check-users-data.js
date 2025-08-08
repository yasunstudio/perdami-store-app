import { Client } from 'pg';

async function checkUsersData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check users table
    const usersResult = await client.query('SELECT id, name, email, role FROM "User" LIMIT 10');
    console.log('\n👥 Users in database:');
    console.log(`Total found: ${usersResult.rows.length}`);
    
    if (usersResult.rows.length > 0) {
      console.log('Sample users:');
      usersResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    } else {
      console.log('❌ No users found in database!');
    }

    // Also check count
    const countResult = await client.query('SELECT COUNT(*) as count FROM "User"');
    console.log(`\n📊 Total users count: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error checking users data:', error);
  } finally {
    await client.end();
  }
}

checkUsersData();
