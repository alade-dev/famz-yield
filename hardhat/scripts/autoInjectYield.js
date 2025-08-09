const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Auto-injects simulated BTC yield into the vault every 7 days.
 * Designed for testnet. Uses mock wBTC and operator-controlled yield injection.
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);

  console.log(`🎯 Operator: ${operator.address}`);
  console.log(`🔗 Network: ${(await ethers.provider.getNetwork()).name}`);

  const LSTBTC_ADDRESS = "0xLstBTC";
  const CUSTODIAN_ADDRESS = "0xCustodian";
  const WBTC_ADDRESS = "0xMockWBTC";
  const VAULT_ADDRESS = "0xVault";

  const wbtc = await ethers.getContractAt("IERC20", WBTC_ADDRESS);
  const custodian = await ethers.getContractAt("Custodian", CUSTODIAN_ADDRESS);
  const lstbtc = await ethers.getContractAt("LstBTC", LSTBTC_ADDRESS);
  const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS);

  const APY = 0.02; // 2% APY
  const SECONDS_PER_YEAR = 31536000;
  const INTERVAL = 7 * 24 * 3600; // 7 days

  const totalSupply = await lstbtc.totalSupply();
  console.log(
    `📊 Total lstBTC Supply: ${ethers.formatUnits(totalSupply, 18)} BTC`
  );

  if (totalSupply === 0n) {
    console.log("⚠️  No deposits yet. Skipping yield.");
    return;
  }

  // Calculate weekly yield: APY * totalSupply / 52
  const weeklyYield =
    ((totalSupply * BigInt(Math.floor(APY * 1e18))) /
      BigInt(SECONDS_PER_YEAR)) *
    BigInt(INTERVAL);
  const weeklyYieldFormatted = ethers.formatUnits(weeklyYield, 18);
  console.log(`📈 Weekly Yield (BTC): ${weeklyYieldFormatted} BTC`);

  // Mint wBTC to operator (mock only)
  const mockWbtc = await ethers.getContractAt("MockWBTC", WBTC_ADDRESS);
  console.log(`🖨️  Minting ${weeklyYieldFormatted} wBTC to operator...`);
  const mintTx = await mockWbtc
    .connect(deployer)
    .mint(operator.address, weeklyYield);
  await mintTx.wait();

  // Approve & transfer to Vault
  console.log("🔁 Approving wBTC transfer...");
  const approveTx = await wbtc
    .connect(operator)
    .approve(VAULT_ADDRESS, weeklyYield);
  await approveTx.wait();

  console.log("📤 Transferring yield to Vault...");
  const transferTx = await wbtc
    .connect(operator)
    .transfer(VAULT_ADDRESS, weeklyYield);
  await transferTx.wait();

  // Emit event in Vault
  console.log("🔔 Notifying Vault of yield...");
  try {
    const tx = await vault.connect(operator).notifyYield(weeklyYield);
    await tx.wait();
    console.log(`✅ Vault notified: ${tx.hash}`);
  } catch (error) {
    console.warn("⚠️ notifyYield not found or failed — continuing...");
  }

  // Distribute lstBTC to all holders
  const recipients = [operator.address];
  const amounts = [weeklyYield];

  console.log("🪙 Distributing lstBTC yield to users...");
  try {
    const distTx = await lstbtc
      .connect(operator)
      .distributeYield(recipients, amounts);
    await distTx.wait();
    console.log(`✅ Yield distributed! Tx: ${distTx.hash}`);
  } catch (error) {
    console.error("❌ Failed to distribute yield:", error.message);
    return;
  }

  const newSupply = await lstbtc.totalSupply();
  console.log(`📈 New lstBTC Supply: ${ethers.formatUnits(newSupply, 18)} BTC`);

  console.log(`⏳ Waiting ${INTERVAL / 86400} days before next injection...\n`);
  setTimeout(main, INTERVAL * 1000);
}

main().catch((error) => {
  console.error("🚨 Script failed:", error);
  process.exitCode = 1;
});
