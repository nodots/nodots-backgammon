const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'nodots',
  password: 'nodots',
  database: 'nodots_backgammon_dev',
});

async function findRobots() {
  try {
    await client.connect();
    
    console.log('Looking for robot users...');
    const robotResult = await client.query(`SELECT id, nickname, email FROM users WHERE user_type = 'robot'`);
    
    console.log('\nRobot users found:');
    robotResult.rows.forEach(robot => {
      console.log(`  ${robot.nickname}: ${robot.id}`);
    });
    
    console.log('\nHuman users:');
    const humanResult = await client.query(`SELECT id, email, nickname FROM users WHERE user_type = 'human'`);
    humanResult.rows.forEach(human => {
      console.log(`  ${human.email}: ${human.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

findRobots();