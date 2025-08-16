#!/usr/bin/env node

// Script to find robot user IDs in database
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { eq } from 'drizzle-orm';
import { UsersTable } from './packages/api/src/db/Users/schema.js';

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
    const db = drizzle(client);
    
    console.log('Looking for robot users...');
    const robots = await db.select().from(UsersTable).where(eq(UsersTable.userType, 'robot'));
    
    console.log('\nRobot users found:');
    robots.forEach(robot => {
      console.log(`  ${robot.nickname}: ${robot.id}`);
    });
    
    console.log('\nHuman users:');
    const humans = await db.select().from(UsersTable).where(eq(UsersTable.userType, 'human'));
    humans.forEach(human => {
      console.log(`  ${human.email}: ${human.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

findRobots();