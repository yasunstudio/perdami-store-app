#!/usr/bin/env node

/**
 * Simple script to run bank seed
 * Usage: npm run seed:banks
 */

require('ts-node/register')
require('dotenv').config()

const { seedBanks, seedAppSettings } = require('./prisma/seed/bank-seed.ts')

async function runSeed() {
  console.log('🌱 Running Bank Seed Script...')
  
  try {
    await seedBanks()
    await seedAppSettings()
    console.log('✅ Bank seed completed!')
  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }
}

runSeed()
