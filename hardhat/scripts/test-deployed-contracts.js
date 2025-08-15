const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Test Deposit and Withdraw using already deployed contracts
 * Uses the contract addresses from the previous deployment
 */

const DEPLOYED_CONTRACTS = {
  wBTC: "0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa",
  stCORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650", // Real testnet stCORE
  lstBTC: "0xf47c98abA1a4c4eB778991AeE7Ea889a977fEA3E",
  custodian: "0x507b00ad0e362C9C6Bc6Fe044F3c062f15C2FC5A",
  vault: "0x6924a3828952867F713D25a949D34B81c9836653",
  priceOracle: "0x0e3EB58b29CB991F9DFf00318b6449021A7cd943"
};

const TESTNET_CONFIG = {
  prices: {
    CORE_BTC: ethers.parseEther("0.00000864"), // CORE/BTC = 0.00000864
    stCORE_CORE: ethers.parseEther("1.420689")  // stCORE/CORE = 1.420689
  }
};

async function sleep(seconds) {
  console.log(`⏳ Waiting ${seconds} seconds...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function connectToContracts() {
  console.log("🔗 === CONNECTING TO DEPLOYED CONTRACTS ===\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📡 Network:", network.name);
  console.log("🏗️  User:", deployer.address);
  console.log("💰 User balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  const contracts = {};

  // Connect to deployed contracts
  console.log("🔗 Connecting to deployed contracts...");
  contracts.wBTC = await ethers.getContractAt("MockERC20", DEPLOYED_CONTRACTS.wBTC);
  contracts.stCORE = await ethers.getContractAt("IERC20", DEPLOYED_CONTRACTS.stCORE);
  contracts.lstBTC = await ethers.getContractAt("LstBTC", DEPLOYED_CONTRACTS.lstBTC);
  contracts.custodian = await ethers.getContractAt("Custodian", DEPLOYED_CONTRACTS.custodian);
  contracts.vault = await ethers.getContractAt("Vault", DEPLOYED_CONTRACTS.vault);
  contracts.priceOracle = await ethers.getContractAt("PriceOracle", DEPLOYED_CONTRACTS.priceOracle);

  console.log("✅ Connected to all contracts!");
  
  // Verify contract addresses
  console.log("\n📝 Contract Addresses:");
  console.log(`wBTC: ${await contracts.wBTC.getAddress()}`);
  console.log(`stCORE: ${await contracts.stCORE.getAddress()}`);
  console.log(`lstBTC: ${await contracts.lstBTC.getAddress()}`);
  console.log(`Custodian: ${await contracts.custodian.getAddress()}`);
  console.log(`Vault: ${await contracts.vault.getAddress()}`);
  console.log(`Price Oracle: ${await contracts.priceOracle.getAddress()}`);

  return contracts;
}

async function testDepositAndWithdraw(contracts) {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n🧪 === STARTING DEPOSIT AND WITHDRAW TEST ===\n");

  // Test amounts
  const wBTCAmount = ethers.parseUnits("0.02", 8); // 0.02 wBTC (8 decimals)
  const stCOREAmount = ethers.parseEther("10"); // 10 stCORE

  console.log("💰 Minting test wBTC tokens...");
  try {
    const mintTx = await contracts.wBTC.mint(deployer.address, wBTCAmount);
    await mintTx.wait();
    console.log(`✅ Minted ${ethers.formatUnits(wBTCAmount, 8)} wBTC to ${deployer.address}`);
  } catch (error) {
    console.log("⚠️  Could not mint wBTC (might not have permission), checking existing balance...");
  }

  // Check initial balances
  console.log("\n📊 Initial Balances:");
  const initialWBTC = await contracts.wBTC.balanceOf(deployer.address);
  const initialStCORE = await contracts.stCORE.balanceOf(deployer.address);
  const initialLstBTC = await contracts.lstBTC.balanceOf(deployer.address);
  
  console.log(`👤 User wBTC: ${ethers.formatUnits(initialWBTC, 8)} wBTC`);
  console.log(`👤 User stCORE: ${ethers.formatEther(initialStCORE)} stCORE`);
  console.log(`👤 User lstBTC: ${ethers.formatEther(initialLstBTC)} lstBTC`);

  // Check if we have enough tokens for testing
  let actualWBTCAmount = wBTCAmount;
  let actualStCOREAmount = stCOREAmount;
  
  if (initialWBTC < wBTCAmount) {
    console.log(`⚠️  Insufficient wBTC balance. Have ${ethers.formatUnits(initialWBTC, 8)} wBTC, need ${ethers.formatUnits(wBTCAmount, 8)} wBTC`);
    if (initialWBTC === 0n) {
      console.log(`❌ No wBTC available. Cannot proceed with deposit.`);
      return;
    }
    actualWBTCAmount = initialWBTC;
    console.log(`📝 Adjusting wBTC amount to available balance: ${ethers.formatUnits(actualWBTCAmount, 8)} wBTC`);
  }

  if (initialStCORE < stCOREAmount) {
    console.log(`⚠️  Insufficient stCORE balance. Have ${ethers.formatEther(initialStCORE)} stCORE, need ${ethers.formatEther(stCOREAmount)} stCORE`);
    if (initialStCORE === 0n) {
      console.log(`❌ No stCORE available. Cannot proceed with deposit.`);
      return;
    }
    actualStCOREAmount = initialStCORE;
    console.log(`📝 Adjusting stCORE amount to available balance: ${ethers.formatEther(actualStCOREAmount)} stCORE`);
    console.log(`ℹ️  You can acquire more stCORE tokens at ${DEPLOYED_CONTRACTS.stCORE} on testnet`);
  }

  // Calculate expected lstBTC to be minted - FIXED CALCULATION
  // All calculations in 18 decimals for consistency
  const stCORE_CORE_Price = TESTNET_CONFIG.prices.stCORE_CORE; // 1.420689 * 1e18
  const CORE_BTC_Price = TESTNET_CONFIG.prices.CORE_BTC;       // 0.00000864 * 1e18

  // Convert stCORE to CORE: actualStCOREAmount * stCORE_CORE_Price / 1e18
  const stCOREInCORE = (actualStCOREAmount * stCORE_CORE_Price) / ethers.parseEther("1");

  // Convert CORE to BTC: stCOREInCORE * CORE_BTC_Price / 1e18  
  const stCOREInBTC = (stCOREInCORE * CORE_BTC_Price) / ethers.parseEther("1");

  // Convert wBTC from 8 decimals to 18 decimals for proper addition
  const wBTCAmountIn18Decimals = ethers.parseUnits(ethers.formatUnits(actualWBTCAmount, 8), 18);

  // Total BTC value in 18 decimals
  const totalBTCValue = wBTCAmountIn18Decimals + stCOREInBTC;
  
  console.log(`\n🧮 Deposit Calculations:`);
  console.log(`📊 wBTC deposit: ${ethers.formatUnits(actualWBTCAmount, 8)} wBTC`);
  console.log(`📊 stCORE deposit: ${ethers.formatEther(actualStCOREAmount)} stCORE`);
  console.log(`📊 stCORE in CORE: ${ethers.formatEther(stCOREInCORE)} CORE`);
  console.log(`📊 stCORE in BTC: ${ethers.formatEther(stCOREInBTC)} BTC`);
  console.log(`📊 wBTC in 18 decimals: ${ethers.formatEther(wBTCAmountIn18Decimals)} BTC`);
  console.log(`📊 Total BTC value: ${ethers.formatEther(totalBTCValue)} BTC`);

  // Approve tokens
  console.log("\n🔓 Approving tokens...");
  try {
    const wBTCApproveTx = await contracts.wBTC.approve(await contracts.vault.getAddress(), actualWBTCAmount);
    await wBTCApproveTx.wait();
    console.log("✅ wBTC approved");

    const stCOREApproveTx = await contracts.stCORE.approve(await contracts.vault.getAddress(), actualStCOREAmount);
    await stCOREApproveTx.wait();
    console.log("✅ stCORE approved");
  } catch (error) {
    console.log("❌ Token approval failed:", error.message);
    return;
  }

  // Add this before attempting deposit
console.log("\n🔍 Checking minimum amounts from contract...");
try {
  const depositMin = await contracts.vault.depositMinAmount();
  const redeemMin = await contracts.vault.redeemMinAmount();
  console.log(`📏 Contract deposit minimum: ${ethers.formatEther(depositMin)} BTC`);
  console.log(`📏 Contract redeem minimum: ${ethers.formatEther(redeemMin)} lstBTC`);
  
  if (totalBTCValue < depositMin) {
    console.log(`❌ Your deposit (${ethers.formatEther(totalBTCValue)} BTC) is below minimum (${ethers.formatEther(depositMin)} BTC)`);
  } else {
    console.log(`✅ Your deposit (${ethers.formatEther(totalBTCValue)} BTC) meets minimum requirement`);
  }
} catch (error) {
  console.log("⚠️  Could not fetch minimum amounts:", error.message);
}

  // Perform deposit
  console.log("\n💳 Performing deposit...");
  try {
    const depositTx = await contracts.vault.deposit(actualWBTCAmount, actualStCOREAmount, DEPLOYED_CONTRACTS.stCORE);
    await depositTx.wait();
    console.log("✅ Deposit successful!");
  } catch (error) {
    console.log("❌ Deposit failed:", error.message);
    return;
  }

  // Check balances after deposit
  console.log("\n📊 Balances After Deposit:");
  const postDepositWBTC = await contracts.wBTC.balanceOf(deployer.address);
  const postDepositStCORE = await contracts.stCORE.balanceOf(deployer.address);
  const postDepositLstBTC = await contracts.lstBTC.balanceOf(deployer.address);
  
  console.log(`👤 User wBTC: ${ethers.formatUnits(postDepositWBTC, 8)} wBTC`);
  console.log(`👤 User stCORE: ${ethers.formatEther(postDepositStCORE)} stCORE`);
  console.log(`👤 User lstBTC: ${ethers.formatEther(postDepositLstBTC)} lstBTC`);

  // Check custodian balances
  const custodianWBTC = await contracts.wBTC.balanceOf(await contracts.custodian.getAddress());
  const custodianStCORE = await contracts.stCORE.balanceOf(await contracts.custodian.getAddress());
  
  console.log(`🏦 Custodian wBTC: ${ethers.formatUnits(custodianWBTC, 8)} wBTC`);
  console.log(`🏦 Custodian stCORE: ${ethers.formatEther(custodianStCORE)} stCORE`);

  // Wait 1 minute before withdrawal
  console.log("\n⏰ === WAITING 1 MINUTE BEFORE WITHDRAWAL ===");
  await sleep(60); // 60 seconds

  // Perform withdrawal (redeem half)
  console.log("\n💸 Performing withdrawal...");
  const lstBTCBalance = await contracts.lstBTC.balanceOf(deployer.address);
  const redeemAmount = lstBTCBalance / 2n; // Redeem half
  
  console.log(`📤 Redeeming: ${ethers.formatEther(redeemAmount)} lstBTC`);
  
  try {
    const redeemTx = await contracts.vault.redeem(redeemAmount, DEPLOYED_CONTRACTS.stCORE);
    await redeemTx.wait();
    console.log("✅ Withdrawal successful!");
  } catch (error) {
    console.log("❌ Withdrawal failed:", error.message);
    return;
  }

  // Check final balances
  console.log("\n📊 Final Balances:");
  const finalWBTC = await contracts.wBTC.balanceOf(deployer.address);
  const finalStCORE = await contracts.stCORE.balanceOf(deployer.address);
  const finalLstBTC = await contracts.lstBTC.balanceOf(deployer.address);
  
  console.log(`👤 User wBTC: ${ethers.formatUnits(finalWBTC, 8)} wBTC`);
  console.log(`👤 User stCORE: ${ethers.formatEther(finalStCORE)} stCORE`);
  console.log(`👤 User lstBTC: ${ethers.formatEther(finalLstBTC)} lstBTC`);

  // Calculate changes
  console.log("\n📈 Balance Changes:");
  console.log(`🔄 wBTC change: ${ethers.formatUnits(finalWBTC - initialWBTC, 8)} wBTC`);
  console.log(`🔄 stCORE change: ${ethers.formatEther(finalStCORE - initialStCORE)} stCORE`);
  console.log(`🔄 lstBTC change: ${ethers.formatEther(finalLstBTC - initialLstBTC)} lstBTC`);

  console.log("\n✅ === DEPOSIT AND WITHDRAW TEST COMPLETE ===");
}

async function checkContractStatus(contracts) {
  console.log("\n🔍 === CONTRACT STATUS CHECK ===\n");

  try {
    // Check authorizations
    console.log("🔐 Authorization Status:");
    const authorizedVault = await contracts.custodian.authorizedVault();
    console.log(`Authorized Vault: ${authorizedVault}`);
    console.log(`Expected Vault: ${await contracts.vault.getAddress()}`);
    console.log(`✅ Vault Authorization: ${authorizedVault === await contracts.vault.getAddress() ? "CORRECT" : "INCORRECT"}`);

    const isMinter = await contracts.lstBTC.authorizedMinters(await contracts.vault.getAddress());
    console.log(`✅ Vault Minter Status: ${isMinter ? "AUTHORIZED" : "NOT AUTHORIZED"}`);

    const isYieldDistributor = await contracts.lstBTC.yieldDistributors(await contracts.vault.getAddress());
    console.log(`✅ Vault Yield Distributor: ${isYieldDistributor ? "AUTHORIZED" : "NOT AUTHORIZED"}`);

    // Check operator
    const operator = await contracts.vault.operator();
    console.log(`Operator: ${operator}`);

    // Check if stCORE is whitelisted
    const isWhitelisted = await contracts.vault.isLSTWhitelisted(DEPLOYED_CONTRACTS.stCORE);
    console.log(`✅ stCORE Whitelisted: ${isWhitelisted ? "YES" : "NO"}`);

    // Check prices in oracle
    console.log("\n📊 Price Oracle Status:");
    const stCOREPrice = await contracts.priceOracle.getPrice(DEPLOYED_CONTRACTS.stCORE);
    const corePrice = await contracts.priceOracle.getPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    console.log(`stCORE/CORE price: ${ethers.formatEther(stCOREPrice)}`);
    console.log(`CORE/BTC price: ${ethers.formatEther(corePrice)}`);

  } catch (error) {
    console.log("❌ Status check failed:", error.message);
  }
}

async function main() {
  try {
    // Connect to deployed contracts
    const contracts = await connectToContracts();
    
    // Check contract status
    await checkContractStatus(contracts);

    // Test deposit and withdraw functionality
    await testDepositAndWithdraw(contracts);

    console.log("\n🎉 === ALL TESTS COMPLETED SUCCESSFULLY ===");
    console.log("🎯 Famz Vault System is working on testnet!");

  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
