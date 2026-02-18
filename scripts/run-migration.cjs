/**
 * Run a specific migration SQL against Supabase
 * Usage: node scripts/run-migration.cjs
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NDA_TEST_SERVICE_ROLE_KEY ||
  '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Refusing to run without explicit env configuration.');
  process.exit(1);
}

const SUPABASE_ORIGIN = (
  SUPABASE_URL.startsWith('http') ? SUPABASE_URL : `https://${SUPABASE_URL}`
).replace(/\/$/, '');

const SUPABASE_HOST = SUPABASE_ORIGIN.replace(/^https?:\/\//, '');

// Read the migration SQL
const sql = fs.readFileSync('./supabase/migrations/20260116000000_create_hushh_agent_users.sql', 'utf8');

console.log('📦 Reading migration SQL...');
console.log('📡 Connecting to Supabase...');

// Use the Supabase Management API to execute SQL
const postData = JSON.stringify({ query: sql });

const options = {
  hostname: SUPABASE_HOST,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Since RPC won't work, let's create the tables directly via PostgREST
// We need to use the supabase-js library instead

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  SUPABASE_ORIGIN,
  SERVICE_KEY
);

async function runMigration() {
  console.log('🚀 Running migration for hushh_agent_users...');
  
  // Check if table already exists
  const { data: existingTable, error: checkError } = await supabase
    .from('hushh_agent_users')
    .select('id')
    .limit(1);
  
  if (!checkError) {
    console.log('✅ Table hushh_agent_users already exists!');
    return;
  }
  
  if (checkError && !checkError.message.includes('does not exist')) {
    console.log('Table check result:', checkError.message);
  }
  
  console.log('❌ Table does not exist. Please run the SQL manually in Supabase Dashboard.');
  console.log('\n📋 Go to: https://supabase.com/dashboard/project/ibsisfnjxeowvdtvgzff/sql');
  console.log('\n📝 Copy and paste this SQL:\n');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
}

runMigration();
