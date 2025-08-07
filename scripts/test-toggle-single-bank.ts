import { SingleBankService } from '../src/lib/single-bank'

async function toggleSingleBankMode() {
  console.log('🔧 Testing Single Bank Mode Toggle...\n')

  try {
    // Current status
    console.log('1. Current Status:')
    const currentStatus = await SingleBankService.isSingleBankModeEnabled()
    console.log(`   Single Bank Mode: ${currentStatus}`)

    // Toggle to opposite
    console.log('\n2. Toggling mode...')
    const newMode = !currentStatus
    await SingleBankService.toggleSingleBankMode(newMode)
    console.log(`   Changed to: ${newMode}`)

    // Check available banks after toggle
    console.log('\n3. Available banks after toggle:')
    const availableBanks = await SingleBankService.getAvailableBanks()
    console.log(`   Count: ${availableBanks.length}`)
    availableBanks.forEach((bank, index) => {
      console.log(`   ${index + 1}. ${bank.name} (${bank.code})`)
    })

    // Toggle back to original
    console.log('\n4. Toggling back to original...')
    await SingleBankService.toggleSingleBankMode(currentStatus)
    console.log(`   Restored to: ${currentStatus}`)

    console.log('\n✅ Toggle test completed successfully!')

  } catch (error) {
    console.error('❌ Error testing toggle:', error)
  }
}

toggleSingleBankMode()
