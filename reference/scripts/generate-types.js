#!/usr/bin/env node
require('dotenv').config();
const { execSync } = require('child_process');

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';
const token = process.env.CONTENTFUL_MANAGEMENT_API_TOKEN;

if (!spaceId || !token) {
  console.error('Missing required environment variables:');
  if (!spaceId) console.error('- CONTENTFUL_SPACE_ID');
  if (!token) console.error('- CONTENTFUL_MANAGEMENT_API_TOKEN');
  process.exit(1);
}

const command = `cf-content-types-generator -s ${spaceId} -e ${environment} -t ${token} --out=./lib/contentful/types/generated --v10 --typeguard`;

console.log('Generating Contentful types...');
try {
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Types generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate types:', error.message);
  process.exit(1);
}