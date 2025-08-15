const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Deployment script for the new Famz Vault system
 * Deploys: wBTC, stCORE, lstBTC, Custodian, Vault, PriceOracle
 * Sets up all authorizations and configurations
 * 
 * Testnet Configuration:
 * - Real stCORE: 0x6401f24EF7C54032f4F54E67492928973Ab87650
 * - CORE/BTC: 0.00000864
 * - stCORE/CORE: 1.420689
 */

const TESTNET_CONFIG = {
  stCORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650", // Real testnet stCORE
  prices: {
    CORE_BTC: ethers.parseEther("0.00000864"), // CORE/BTC = 0.00000864
    stCORE_CORE: ethers.parseEther("1.420689")  // stCORE/CORE = 1.420689
  }
};

async function main() {
  console.log("🚀 === DEPLOYING FAMZ VAULT SYSTEM ===\n");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📡 Network:", network.name);
  console.log("🏗️  Deployer:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Deploy contracts
  const contracts = {};

  // Deploy mock wBTC (use real wBTC address on mainnet: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599)
  console.log("📦 Deploying Mock wBTC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  contracts.wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 8); // wBTC has 8 decimals
  await contracts.wBTC.waitForDeployment();
  console.log("✅ wBTC:", await contracts.wBTC.getAddress());
  
  // Use real stCORE address for testnet
  console.log(`\n🪙 Using real stCORE token: ${TESTNET_CONFIG.stCORE}`);
  contracts.stCORE = await ethers.getContractAt("IERC20", TESTNET_CONFIG.stCORE);

  // Price Oracle with real prices
  console.log("\n📊 Deploying Price Oracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  contracts.priceOracle = await PriceOracle.deploy();
  await contracts.priceOracle.waitForDeployment();
  console.log("✅ Price Oracle:", await contracts.priceOracle.getAddress());
  
  // Set real prices
  await contracts.priceOracle.setPrice(TESTNET_CONFIG.stCORE, TESTNET_CONFIG.prices.stCORE_CORE);
  await contracts.priceOracle.setPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", TESTNET_CONFIG.prices.CORE_BTC);
  console.log(`✅ stCORE/CORE price set: ${ethers.formatEther(TESTNET_CONFIG.prices.stCORE_CORE)}`);
  console.log(`✅ CORE/BTC price set: ${ethers.formatEther(TESTNET_CONFIG.prices.CORE_BTC)}`);

  // lstBTC Token  
  console.log("\n🪙 Deploying lstBTC Token...");
  const LstBTC = await ethers.getContractFactory("LstBTC");
  contracts.lstBTC = await LstBTC.deploy(deployer.address);
  await contracts.lstBTC.waitForDeployment();
  console.log("✅ lstBTC:", await contracts.lstBTC.getAddress());

  // Custodian
  console.log("\n🏦 Deploying Custodian...");
  const Custodian = await ethers.getContractFactory("Custodian");
  contracts.custodian = await Custodian.deploy(
    await contracts.wBTC.getAddress(),
    TESTNET_CONFIG.stCORE, // Use real stCORE address
    await contracts.lstBTC.getAddress(),
    await contracts.priceOracle.getAddress(),
    deployer.address
  );
  await contracts.custodian.waitForDeployment();
  console.log("✅ Custodian:", await contracts.custodian.getAddress());

  // Vault
  console.log("\n🏛️  Deploying Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  contracts.vault = await Vault.deploy(
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

  // Output deployment summary
  console.log("\n📝 === DEPLOYMENT COMPLETE ===");
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
  
  console.log("\n✅ All contracts deployed and configured!");
  console.log("🎯 Ready for testing and interaction");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });