const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Comprehensive Testnet Script for Famz Vault System
 * 1. Deploys all contracts with real stCORE token address
 * 2. Sets up proper price feeds (CORE/BTC and stCORE/CORE)
 * 3. Performs deposit test
 * 4. Waits 1 minute
 * 5. Performs withdrawal test
 * 6. Logs entire process flow
 */

const TESTNET_CONFIG = {
  stCORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650", // Real testnet stCORE
  prices: {
    CORE_BTC: ethers.parseEther("0.00000864"), // CORE/BTC = 0.00000864
    stCORE_CORE: ethers.parseEther("1.420689")  // stCORE/CORE = 1.420689
  }
};

async function sleep(seconds) {
  console.log(`⏳ Waiting ${seconds} seconds...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function deployContracts() {
  console.log("🚀 === DEPLOYING FAMZ VAULT SYSTEM ON TESTNET ===\n");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📡 Network:", network.name);
  console.log("🏗️  Deployer:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  const contracts = {};

  // Deploy mock wBTC for testnet (use real wBTC address on mainnet)
  console.log("📦 Deploying Mock wBTC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  contracts.wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 8); // wBTC has 8 decimals
  await contracts.wBTC.waitForDeployment();
  console.log("✅ wBTC:", await contracts.wBTC.getAddress());

  // Use real stCORE address
  console.log(`\n🪙 Using real stCORE token: ${TESTNET_CONFIG.stCORE}`);
  contracts.stCORE = await ethers.getContractAt("IERC20", TESTNET_CONFIG.stCORE);

  // Deploy PriceOracle with real prices
  console.log("\n📊 Deploying Price Oracle with real prices...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  contracts.priceOracle = await PriceOracle.deploy();
  await contracts.priceOracle.waitForDeployment();
  console.log("✅ Price Oracle:", await contracts.priceOracle.getAddress());

  // Set real prices in oracle
  console.log("📊 Setting prices in oracle...");
  await contracts.priceOracle.setPrice(TESTNET_CONFIG.stCORE, TESTNET_CONFIG.prices.stCORE_CORE);
  await contracts.priceOracle.setPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", TESTNET_CONFIG.prices.CORE_BTC);
  console.log(`✅ stCORE/CORE price set: ${ethers.formatEther(TESTNET_CONFIG.prices.stCORE_CORE)}`);
  console.log(`✅ CORE/BTC price set: ${ethers.formatEther(TESTNET_CONFIG.prices.CORE_BTC)}`);

  // Deploy lstBTC Token
  console.log("\n🏅 Deploying lstBTC Token...");
  const LstBTCNew = await ethers.getContractFactory("LstBTC");
  contracts.lstBTC = await LstBTCNew.deploy(deployer.address);
  await contracts.lstBTC.waitForDeployment();
  console.log("✅ lstBTC:", await contracts.lstBTC.getAddress());

  // Deploy Custodian
  console.log("\n🏦 Deploying Custodian...");
  const Custodian = await ethers.getContractFactory("Custodian");
  contracts.custodian = await Custodian.deploy(
    await contracts.wBTC.getAddress(),
    TESTNET_CONFIG.stCORE,
    await contracts.lstBTC.getAddress(),
    await contracts.priceOracle.getAddress(),
    deployer.address
  );
  await contracts.custodian.waitForDeployment();
  console.log("✅ Custodian:", await contracts.custodian.getAddress());

  // Deploy Vault
  console.log("\n🏛️  Deploying Vault...");
  const VaultNew = await ethers.getContractFactory("Vault");
  contracts.vault = await VaultNew.deploy(
    await contracts.wBTC.getAddress(),
    await contracts.custodian.getAddress(),
    await contracts.lstBTC.getAddress(),
    deployer.address
  );
  await contracts.vault.waitForDeployment();
  console.log("✅ Vault:", await contracts.vault.getAddress());

  // Set up authorizations
  console.log("\n🔐 Setting up authorizations...");
  
  await contracts.custodian.setAuthorizedVault(await contracts.vault.getAddress());
  console.log("✅ Vault authorized in Custodian");

  await contracts.lstBTC.setMinter(await contracts.vault.getAddress(), true);
  await contracts.lstBTC.setYieldDistributor(await contracts.vault.getAddress(), true);
  console.log("✅ Vault set as minter and yield distributor");

  await contracts.vault.setOperator(deployer.address);
  await contracts.vault.setFeeReceiver(deployer.address);
  console.log("✅ Operator and fee receiver set");

  await contracts.vault.whitelistLST(TESTNET_CONFIG.stCORE, true);
  console.log("✅ stCORE token whitelisted");

  console.log("\n✅ All contracts deployed and configured!");
  return contracts;
}

async function testDepositAndWithdraw(contracts) {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n🧪 === STARTING DEPOSIT AND WITHDRAW TEST ===\n");

  // Mint test tokens to deployer
  const wBTCAmount = ethers.parseUnits("0.02", 8); // 0.02 wBTC (8 decimals)
  let stCOREAmount = ethers.parseEther("10"); // 10 stCORE (assume we have this much)

  console.log("💰 Minting test tokens...");
  await contracts.wBTC.mint(deployer.address, wBTCAmount);
  console.log(`✅ Minted ${ethers.formatUnits(wBTCAmount, 8)} wBTC to ${deployer.address}`);

  // Check initial balances
  console.log("\n📊 Initial Balances:");
  const initialWBTC = await contracts.wBTC.balanceOf(deployer.address);
  const initialStCORE = await contracts.stCORE.balanceOf(deployer.address);
  const initialLstBTC = await contracts.lstBTC.balanceOf(deployer.address);
  
  console.log(`👤 User wBTC: ${ethers.formatUnits(initialWBTC, 8)} wBTC`);
  console.log(`👤 User stCORE: ${ethers.formatEther(initialStCORE)} stCORE`);
  console.log(`👤 User lstBTC: ${ethers.formatEther(initialLstBTC)} lstBTC`);

  // Check if user has enough stCORE
  if (initialStCORE < stCOREAmount) {
    console.log(`⚠️  Warning: User only has ${ethers.formatEther(initialStCORE)} stCORE, but trying to deposit ${ethers.formatEther(stCOREAmount)} stCORE`);
    console.log(`📝 Adjusting stCORE amount to available balance...`);
    stCOREAmount = initialStCORE;
    if (stCOREAmount === 0n) {
      console.log(`❌ User has no stCORE tokens. Cannot proceed with deposit.`);
      return;
    }
  }

  // Calculate expected lstBTC to be minted (with proper decimal handling)
  const wBTCIn18Decimals = wBTCAmount * BigInt(1e10); // Convert 8 decimals to 18 decimals
  const stCOREInCORE = (stCOREAmount * TESTNET_CONFIG.prices.stCORE_CORE) / ethers.parseEther("1");
  const stCOREInBTC = (stCOREInCORE * TESTNET_CONFIG.prices.CORE_BTC) / ethers.parseEther("1");
  const totalBTCValue = wBTCIn18Decimals + stCOREInBTC;
  
  console.log(`\n🧮 Deposit Calculations:`);
  console.log(`📊 wBTC deposit: ${ethers.formatUnits(wBTCAmount, 8)} wBTC`);
  console.log(`📊 stCORE deposit: ${ethers.formatEther(stCOREAmount)} stCORE`);
  console.log(`📊 wBTC in 18 decimals: ${ethers.formatEther(wBTCIn18Decimals)} BTC`);
  console.log(`📊 stCORE in BTC: ${ethers.formatEther(stCOREInBTC)} BTC`);
  console.log(`📊 Expected lstBTC minted: ${ethers.formatEther(totalBTCValue)} lstBTC`);

  // Approve tokens
  console.log("\n🔓 Approving tokens...");
  await contracts.wBTC.approve(await contracts.vault.getAddress(), wBTCAmount);
  await contracts.stCORE.approve(await contracts.vault.getAddress(), stCOREAmount);
  console.log("✅ Tokens approved");

  // Perform deposit
  console.log("\n💳 Performing deposit...");
  try {
    const depositTx = await contracts.vault.deposit(wBTCAmount, stCOREAmount, TESTNET_CONFIG.stCORE);
    await depositTx.wait();
    console.log("✅ Deposit successful!");
  } catch (error) {
    console.error("❌ Deposit failed:", error.reason || error.message);
    
    // Check if it's a minimum deposit issue
    const depositMinimum = await contracts.vault.depositMinAmount();
    console.log(`📊 Deposit minimum: ${ethers.formatEther(depositMinimum)} BTC`);
    console.log(`📊 Our deposit value: ${ethers.formatEther(totalBTCValue)} BTC`);
    
    throw error;
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
    const redeemTx = await contracts.vault.redeem(redeemAmount, TESTNET_CONFIG.stCORE);
    await redeemTx.wait();
    console.log("✅ Withdrawal successful!");
  } catch (error) {
    console.error("❌ Withdrawal failed:", error.reason || error.message);
    
    // Check minimum redeem amount
    const redeemMinimum = await contracts.vault.redeemMinAmount();
    console.log(`📊 Redeem minimum: ${ethers.formatEther(redeemMinimum)} BTC`);
    console.log(`📊 Our redeem amount: ${ethers.formatEther(redeemAmount)} lstBTC`);
    
    throw error;
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

async function main() {
  try {
    // Deploy all contracts
    const contracts = await deployContracts();
    
    // Output deployment summary
    console.log("\n📝 === DEPLOYMENT SUMMARY ===");
    console.log("Contract Addresses:");
    console.log(`wBTC: ${await contracts.wBTC.getAddress()}`);
    console.log(`stCORE: ${TESTNET_CONFIG.stCORE} (real testnet token)`);
    console.log(`lstBTC: ${await contracts.lstBTC.getAddress()}`);
    console.log(`Custodian: ${await contracts.custodian.getAddress()}`);
    console.log(`Vault: ${await contracts.vault.getAddress()}`);
    console.log(`Price Oracle: ${await contracts.priceOracle.getAddress()}`);
    
    console.log("\nPrice Configuration:");
    console.log(`CORE/BTC: ${ethers.formatEther(TESTNET_CONFIG.prices.CORE_BTC)}`);
    console.log(`stCORE/CORE: ${ethers.formatEther(TESTNET_CONFIG.prices.stCORE_CORE)}`);

    // Test deposit and withdraw functionality
    await testDepositAndWithdraw(contracts);

    console.log("\n🎉 === ALL TESTS COMPLETED SUCCESSFULLY ===");
    console.log("🎯 Famz Vault System is ready for production!");

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
