const hre = require("hardhat");

async function main() {
  console.log("\n🚀 === EPOCH-BASED TESTNET DEMO ===\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);

  // Contract addresses (update these with your deployed contracts)
  const CONTRACTS = {
    vault: "0x...", // Your vault address
    wBTC: "0x...", // Your wBTC address  
    stCORE: "0x...", // Your stCORE address
    lstBTC: "0x..." // Your lstBTC address
  };

  // Get contract instances
  const vault = await hre.ethers.getContractAt("Vault", CONTRACTS.vault);
  const wBTC = await hre.ethers.getContractAt("MockERC20", CONTRACTS.wBTC);
  const stCORE = await hre.ethers.getContractAt("MockERC20", CONTRACTS.stCORE);
  const lstBTC = await hre.ethers.getContractAt("LstBTC", CONTRACTS.lstBTC);

  // === DEMONSTRATION 1: DEPOSIT FLOW ===
  console.log("📅 === DEPOSIT DEMONSTRATION ===");
  
  const wBTCAmount = hre.ethers.parseUnits("0.01", 8); // 0.01 wBTC
  const stCOREAmount = hre.ethers.parseEther("5"); // 5 stCORE

  console.log(`💰 Preparing to deposit:`);
  console.log(`   - ${hre.ethers.formatUnits(wBTCAmount, 8)} wBTC`);
  console.log(`   - ${hre.ethers.formatEther(stCOREAmount)} stCORE`);

  // Check current epoch
  const currentEpoch = await vault.currentEpoch();
  console.log(`📊 Current epoch: ${currentEpoch}`);

  // Approve tokens
  console.log("🔓 Approving tokens...");
  await wBTC.approve(CONTRACTS.vault, wBTCAmount);
  await stCORE.approve(CONTRACTS.vault, stCOREAmount);

  // Perform deposit
  console.log("📥 Performing deposit...");
  const depositTx = await vault.deposit(wBTCAmount, stCOREAmount, CONTRACTS.stCORE);
  await depositTx.wait();
  console.log("✅ Deposit completed!");

  // Check user's yield eligibility epoch
  const firstDepositEpoch = await vault.userFirstDepositEpoch(deployer.address);
  console.log(`📝 You will start earning yield in epoch: ${firstDepositEpoch}`);
  console.log(`⏳ Current epoch: ${currentEpoch}, so you must wait until next epoch closes`);

  // Check lstBTC balance
  const lstBTCBalance = await lstBTC.balanceOf(deployer.address);
  console.log(`💎 Your lstBTC balance: ${hre.ethers.formatEther(lstBTCBalance)} lstBTC`);

  // === DEMONSTRATION 2: REDEMPTION FLOW ===
  console.log("\n📅 === REDEMPTION DEMONSTRATION ===");
  
  const redeemAmount = lstBTCBalance / 4n; // Redeem 25%
  console.log(`💸 Queueing redemption for: ${hre.ethers.formatEther(redeemAmount)} lstBTC`);

  // Approve lstBTC for redemption
  console.log("🔓 Approving lstBTC for redemption...");
  await lstBTC.approve(CONTRACTS.vault, redeemAmount);

  // Queue redemption (new standard method)
  console.log("📤 Queueing redemption...");
  const redeemTx = await vault.redeem(redeemAmount, CONTRACTS.stCORE);
  await redeemTx.wait();
  console.log("✅ Redemption queued!");

  console.log(`⏳ Your redemption will be processed at the end of epoch ${currentEpoch}`);
  console.log("🔄 Tokens are locked in the vault until epoch processing");

  // Check updated balance
  const remainingYieldBalance = await vault.userBalances(deployer.address);
  console.log(`📊 Your remaining balance eligible for yield: ${hre.ethers.formatEther(remainingYieldBalance)} lstBTC`);

  // === EMERGENCY REDEMPTION DEMO ===
  console.log("\n🚨 === EMERGENCY REDEMPTION DEMONSTRATION ===");
  console.log("🔔 For urgent needs, you can use emergency redemption (1% fee):");
  
  const emergencyAmount = hre.ethers.parseEther("0.1");
  console.log(`💸 Emergency redeeming: ${hre.ethers.formatEther(emergencyAmount)} lstBTC (with 1% fee)`);
  
  // Note: Uncomment below to actually perform emergency redemption
  // const emergencyTx = await vault.emergencyRedeem(emergencyAmount, CONTRACTS.stCORE);
  // await emergencyTx.wait();
  // console.log("✅ Emergency redemption completed immediately!");

  console.log("\n🎯 === EPOCH-BASED SYSTEM SUMMARY ===");
  console.log("📥 Deposits: Start earning yield from NEXT epoch");
  console.log("📤 Redemptions: Queued and processed at epoch boundaries");
  console.log("🚨 Emergency: Available immediately with 1% fee");
  console.log("⏰ Epochs: 24-hour cycles with predictable yield distribution");

  console.log("\n✅ === DEMONSTRATION COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
