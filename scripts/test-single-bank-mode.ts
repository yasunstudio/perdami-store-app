import { SingleBankService } from '../src/lib/single-bank'

async function testSingleBankMode() {
  console.log('🔧 Testing Single Bank Mode Configuration...\n')

  try {
    // Test 1: Check if single bank mode is enabled
    const isSingleBankMode = await SingleBankService.isSingleBankModeEnabled()
    console.log(`1. Single Bank Mode Status: ${isSingleBankMode ? '✅ ENABLED' : '❌ DISABLED'}`)

    // Test 2: Get default bank
    const defaultBank = await SingleBankService.getDefaultBank()
    console.log(`2. Default Bank: ${defaultBank ? defaultBank.name + ' (' + defaultBank.code + ')' : '❌ No default bank'}`)

    // Test 3: Get available banks
    const availableBanks = await SingleBankService.getAvailableBanks()
    console.log(`3. Available Banks Count: ${availableBanks.length}`)
    availableBanks.forEach((bank, index) => {
      console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${bank.accountName}`)
    })

    // Test 4: Get full configuration
    console.log('\n4. Full Configuration:')
    const config = await SingleBankService.getConfiguration()
    if (config) {
      console.log(`   - Single Bank Mode: ${config.singleBankMode}`)
      console.log(`   - Default Bank: ${config.defaultBank?.name || 'None'}`)
      console.log(`   - Total Banks Available: ${config.allBanks.length}`)
    }

    console.log('\n✅ Single Bank Mode test completed successfully!')

  } catch (error) {
    console.error('❌ Error testing single bank mode:', error)
  }
}

testSingleBankMode()
