/**
 * Test Vercel API Credentials
 * Diagnostic script to verify token and project configuration
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function testVercelAPI() {
  console.log('🔍 Testing Vercel API credentials...\n');

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    console.error('❌ Missing VERCEL_TOKEN or VERCEL_PROJECT_ID');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Token: ${token?.substring(0, 10)}...`);
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Team ID: ${teamId || '(not set)'}\n`);

  // Test 1: Get user info
  console.log('Test 1: Get authenticated user info...');
  try {
    const userResponse = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const userData = await userResponse.json();

    if (userResponse.ok) {
      console.log(`   ✅ Authenticated as: ${userData.user?.username || userData.user?.email}`);
      console.log(`   Account type: ${userData.user?.platformVersion || 'N/A'}\n`);
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(userData)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 2: Get project WITHOUT team ID
  console.log('Test 2: Get project info (without teamId)...');
  try {
    const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const projectData = await projectResponse.json();

    if (projectResponse.ok) {
      console.log(`   ✅ Project found: ${projectData.name}`);
      console.log(`   Project ID: ${projectData.id}`);
      console.log(`   Account: ${projectData.accountId || 'N/A'}`);
      console.log(`   Framework: ${projectData.framework || 'N/A'}\n`);
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(projectData)}`);

      if (projectData.error?.code === 'forbidden' || projectData.error?.code === 'not_found') {
        console.log(`   ℹ️  This might be a TEAM project - trying with teamId...\n`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 3: List all teams
  console.log('Test 3: List teams accessible to this token...');
  try {
    const teamsResponse = await fetch('https://api.vercel.com/v2/teams', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const teamsData = await teamsResponse.json();

    if (teamsResponse.ok && teamsData.teams?.length > 0) {
      console.log(`   ✅ Found ${teamsData.teams.length} team(s):`);
      teamsData.teams.forEach((team: any) => {
        console.log(`      - ${team.name} (ID: ${team.id})`);
      });
      console.log('');
    } else if (teamsResponse.ok && teamsData.teams?.length === 0) {
      console.log(`   ℹ️  No teams found - this is a PERSONAL account\n`);
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(teamsData)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 4: Try getting project with team context (if teams exist)
  console.log('Test 4: Try domain API call (the actual operation we need)...');
  try {
    const domainCheckUrl = `https://api.vercel.com/v9/projects/${projectId}/domains/test.infiniatransfers.com`;
    const domainResponse = await fetch(domainCheckUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const domainData = await domainResponse.json();

    if (domainResponse.ok) {
      console.log(`   ✅ Domain API accessible`);
      console.log(`   Domain status: ${JSON.stringify(domainData)}\n`);
    } else {
      console.log(`   ❌ Domain API failed: ${JSON.stringify(domainData)}`);

      if (domainData.error?.code === 'forbidden') {
        console.log(`
   🎯 ROOT CAUSE: Token doesn't have permission to access this project

   Possible reasons:
   1. Project belongs to a TEAM but VERCEL_TEAM_ID not set
   2. Token doesn't have "Full Account" scope
   3. Token is from different Vercel account than project
   4. Project ID is incorrect
        `);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('Based on the results above:');
  console.log('- If Test 3 shows teams: Add that team ID to VERCEL_TEAM_ID');
  console.log('- If Test 2 succeeded: Configuration is correct');
  console.log('- If all tests fail with "forbidden": Token scope issue');
  console.log('='.repeat(60));
}

testVercelAPI().catch(console.error);
