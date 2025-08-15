const { ethers } = require("hardhat");
require("dotenv").config();

// Contract addresses - update these after deployment
const DEPLOYED_CONTRACTS = {
  wBTC: "0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa",
  stCORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650", // Real testnet stCORE
  lstBTC: "0xf47c98abA1a4c4eB778991AeE7Ea889a977fEA3E",
  custodian: "0x507b00ad0e362C9C6Bc6Fe044F3c062f15C2FC5A",
  vault: "0x6924a3828952867F713D25a949D34B81c9836653",
  priceOracle: "0x0e3EB58b29CB991F9DFf00318b6449021A7cd943"
};

// External price feed APIs
const PRICE_SOURCES = {
  COINGECKO: {
    CORE_BTC: "https://api.coingecko.com/api/v3/simple/price?ids=coredao&vs_currencies=btc"
  }
};

// Default prices and yield amounts
const FALLBACK_PRICES = {
  CORE_BTC: ethers.parseEther("0.00000864"), // CORE/BTC = 0.00000864
  stCORE_CORE: ethers.parseEther("1.420689")  // stCORE/CORE = 1.420689
};

const DEFAULT_YIELD = {
  wBTC: ethers.parseUnits("0.01", 8),  // 0.01 wBTC daily yield
  stCORE: ethers.parseEther("0.5")     // 0.5 stCORE daily yield
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

async function sleep(seconds) {
  console.log(`⏳ Waiting ${seconds} seconds...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// ========================================
// PRICE MANAGEMENT
// ========================================

async function fetchLatestPrices() {
  console.log("📡 Fetching latest prices...");
  
  try {
    // Fetch CORE/BTC price directly
    const coreResponse = await fetch(PRICE_SOURCES.COINGECKO.CORE_BTC);
    const coreData = await coreResponse.json();
    const coreBtcPrice = coreData.coredao?.btc;
    
    if (!coreBtcPrice) {
      throw new Error("Failed to fetch CORE/BTC price from API");
    }
    
    // Convert to wei (18 decimals)
    const coreBtcPriceWei = ethers.parseEther(coreBtcPrice.toString());
    
    console.log(`📊 CORE/BTC: ${coreBtcPrice.toFixed(8)}`);
    
    return {
      CORE_BTC: coreBtcPriceWei,
      stCORE_CORE: FALLBACK_PRICES.stCORE_CORE // Static for now
    };
    
  } catch (error) {
    console.log(`⚠️  Price fetch failed: ${error.message} - using fallback prices`);
    return FALLBACK_PRICES;
  }
}

async function updatePriceOracle(contracts, prices) {
  console.log("💱 Updating price oracle (parallel)...");
  const startTime = Date.now();
  
  try {
    // Execute both price updates in parallel for speed
    const [coreUpdateTx, stCoreUpdateTx] = await Promise.all([
      contracts.priceOracle.setPrice(
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // CORE native token
        prices.CORE_BTC
      ),
      contracts.priceOracle.setPrice(
        DEPLOYED_CONTRACTS.stCORE,
        prices.stCORE_CORE
      )
    ]);
    
    // Wait for both transactions to be mined
    await Promise.all([coreUpdateTx.wait(), stCoreUpdateTx.wait()]);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Both prices updated in ${duration.toFixed(1)}s`);
    console.log(`   CORE/BTC: ${ethers.formatEther(prices.CORE_BTC)}`);
    console.log(`   stCORE/CORE: ${ethers.formatEther(prices.stCORE_CORE)}`);
    
    return true;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Price update failed after ${duration.toFixed(1)}s: ${error.message}`);
    return false;
  }
}

// ========================================
// YIELD MANAGEMENT
// ========================================

async function generateMockYield(contracts) {
  console.log("💰 Generating daily yield...");
  const startTime = Date.now();
  
  // Parse command line args for custom yield amounts
  const args = process.argv.slice(2);
  let wBTCYield = DEFAULT_YIELD.wBTC;
  let stCOREYield = DEFAULT_YIELD.stCORE;
  
  // Check for --yield flag with amounts
  const yieldIndex = args.findIndex(arg => arg === '--yield');
  if (yieldIndex !== -1 && args[yieldIndex + 1] && args[yieldIndex + 2]) {
    wBTCYield = ethers.parseUnits(args[yieldIndex + 1], 8);
    stCOREYield = ethers.parseEther(args[yieldIndex + 2]);
    console.log("📝 Using custom yield amounts");
  }
  
  console.log(`🎯 Daily yield: ${ethers.formatUnits(wBTCYield, 8)} wBTC + ${ethers.formatEther(stCOREYield)} stCORE`);
  
  try {
    // Execute yield generation and notification in sequence (must be sequential)
    if (wBTCYield > 0n) {
      const wBTCMintTx = await contracts.wBTC.mint(
        await contracts.custodian.getAddress(),
        wBTCYield
      );
      await wBTCMintTx.wait();
    }
    
    // Notify vault of new yield
    const notifyTx = await contracts.vault.notifyYield(wBTCYield, stCOREYield);
    await notifyTx.wait();
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Yield generated & notified in ${duration.toFixed(1)}s`);
    
    return { wBTCYield, stCOREYield };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Yield generation failed after ${duration.toFixed(1)}s: ${error.message}`);
    return null;
  }
}

// ========================================
// EPOCH MANAGEMENT (OPTIMIZED)
// ========================================

async function executeEpochTransition(contracts) {
  console.log("🔄 Executing epoch transition (24+ hours guaranteed by cron timing)...");
  const startTime = Date.now();
  
  try {
    // Execute epoch operations in sequence (must be sequential)
    console.log("� Closing current epoch...");
    const closeTx = await contracts.vault.closeEpoch();
    await closeTx.wait();
    
    console.log("💎 Distributing yield...");
    const distributeTx = await contracts.vault.distributeEpochYield();
    await distributeTx.wait();
    
    console.log("🚀 Starting new epoch...");
    const startTx = await contracts.vault.startNewEpoch();
    await startTx.wait();
    
    const newEpoch = await contracts.vault.currentEpoch();
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Epoch transition completed in ${duration.toFixed(1)}s! New epoch: ${newEpoch}`);
    
    return true;
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    // Handle expected errors gracefully
    if (error.message.includes("Already closed")) {
      console.log(`ℹ️  Epoch already closed - continuing with distribution...`);
      try {
        const distributeTx = await contracts.vault.distributeEpochYield();
        await distributeTx.wait();
        const startTx = await contracts.vault.startNewEpoch();
        await startTx.wait();
        const newEpoch = await contracts.vault.currentEpoch();
        console.log(`✅ Completed epoch transition! New epoch: ${newEpoch}`);
        return true;
      } catch (secondError) {
        console.log(`❌ Secondary error in epoch transition: ${secondError.message}`);
        return false;
      }
    } else if (error.message.includes("No yield")) {
      console.log(`ℹ️  No yield to distribute - starting new epoch...`);
      try {
        const startTx = await contracts.vault.startNewEpoch();
        await startTx.wait();
        const newEpoch = await contracts.vault.currentEpoch();
        console.log(`✅ New epoch started! Current epoch: ${newEpoch}`);
        return true;
      } catch (thirdError) {
        console.log(`❌ Failed to start new epoch: ${thirdError.message}`);
        return false;
      }
    } else {
      console.log(`❌ Epoch transition failed after ${duration.toFixed(1)}s: ${error.message}`);
      return false;
    }
  }
}

// ========================================
// CONNECTION & MAIN LOGIC
// ========================================

async function connectToContracts() {
  console.log("🔗 Connecting to contracts...");

  const [operator] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📡 ${network.name} | 👤 ${operator.address.slice(0,8)}... | 💰 ${ethers.formatEther(await ethers.provider.getBalance(operator.address)).slice(0,6)} ETH`);

  const contracts = {};

  try {
    contracts.wBTC = await ethers.getContractAt("MockERC20", DEPLOYED_CONTRACTS.wBTC);
    contracts.stCORE = await ethers.getContractAt("IERC20", DEPLOYED_CONTRACTS.stCORE);
    contracts.lstBTC = await ethers.getContractAt("LstBTC", DEPLOYED_CONTRACTS.lstBTC);
    contracts.custodian = await ethers.getContractAt("Custodian", DEPLOYED_CONTRACTS.custodian);
    contracts.vault = await ethers.getContractAt("Vault", DEPLOYED_CONTRACTS.vault);
    contracts.priceOracle = await ethers.getContractAt("PriceOracle", DEPLOYED_CONTRACTS.priceOracle);
    
    console.log("✅ All contracts connected!");
    return contracts;
    
  } catch (error) {
    console.log(`❌ Failed to connect to contracts: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log("🤖 === FAMZ VAULT DAILY OPERATOR (OPTIMIZED FOR <30s) ===");
  const scriptStartTime = Date.now();
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  
  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📖 Usage: npx hardhat run scripts/unified-daily-operator.js [options]

Options:
  --yield <wBTCAmount> <stCOREAmount>   Set custom daily yield amounts
  --help, -h                           Show this help message

Examples:
  npx hardhat run scripts/unified-daily-operator.js                    # Use default yield
  npx hardhat run scripts/unified-daily-operator.js --yield 0.05 1.0   # Custom yield amounts
  
Default daily yield:
  wBTC: ${ethers.formatUnits(DEFAULT_YIELD.wBTC, 8)} wBTC
  stCORE: ${ethers.formatEther(DEFAULT_YIELD.stCORE)} stCORE
`);
    process.exit(0);
  }
  
  try {
    // 1. Connect to contracts (2s)
    const contracts = await connectToContracts();
    
    // 2. Generate today's yield FIRST (so it can be distributed in epoch transition)
    console.log("\n💰 Generating today's yield for distribution...");
    const yieldResult = await generateMockYield(contracts);
    
    // 3. Execute epoch transition (uses yesterday's prices + distributes today's yield)
    console.log("\n🎯 Executing epoch transition with yesterday's prices...");
    const epochSuccess = await executeEpochTransition(contracts);
    
    // 4. Fetch and update new prices for the new epoch
    console.log("\n� Fetching and updating prices for new epoch...");
    const latestPrices = await fetchLatestPrices();
    const priceUpdateSuccess = await updatePriceOracle(contracts, latestPrices);
    
    // 5. Final status and timing
    const totalTime = (Date.now() - scriptStartTime) / 1000;
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 DAILY OPERATIONS SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`⏱️  Total execution time: ${totalTime.toFixed(1)} seconds`);
    console.log(`� Epoch transition: ${epochSuccess ? "✅ SUCCESS" : "❌ FAILED"} (used yesterday's prices)`);
    console.log(`� Price updates: ${priceUpdateSuccess ? "✅ SUCCESS" : "❌ FAILED"} (new prices for new epoch)`);
    console.log(`� Yield generation: ${yieldResult ? "✅ SUCCESS" : "❌ FAILED"} (for next epoch)`);
    
    if (totalTime < 30) {
      console.log(`🎉 Target achieved! Completed in ${totalTime.toFixed(1)}s (<30s)`);
    } else {
      console.log(`⚠️  Exceeded target: ${totalTime.toFixed(1)}s (>30s)`);
    }
    
    const allSuccess = priceUpdateSuccess && yieldResult && epochSuccess;
    if (!allSuccess) {
      console.log(`⚠️  Some operations failed - system will continue but manual check recommended`);
    } else {
      console.log(`✅ All operations successful - vault ready for new epoch!`);
    }
    
    console.log(`🕐 Completed: ${new Date().toISOString()}`);
    
    // Exit with appropriate code for cron monitoring
    process.exit(allSuccess ? 0 : 1);
    
  } catch (error) {
    const totalTime = (Date.now() - scriptStartTime) / 1000;
    console.error(`\n❌ === FATAL ERROR AFTER ${totalTime.toFixed(1)}s ===`);
    console.error("Critical failure:", error.message);
    console.error("🚨 Manual intervention required");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
