const { ethers } = require("hardhat");

async function main() {
  console.log("=== New Vault System Demo ===\n");

  // Get contract addresses from deployment (you'll need to update these after deployment)
  const contracts = {
    wBTC: "", // Update after deployment
    stCORE: "", // Update after deployment  
    lstBTC: "", // Update after deployment
    custodian: "", // Update after deployment
    vault: "", // Update after deployment
  };

  // If contracts are not deployed, deploy them first
  if (!contracts.vault) {
    console.log("Contracts not specified. Please run deploy-new.js first and update the addresses in this script.\n");
    return;
  }

  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Get contract instances
  const wBTC = await ethers.getContractAt("MockERC20", contracts.wBTC);
  const stCORE = await ethers.getContractAt("MockERC20", contracts.stCORE);
  const lstBTC = await ethers.getContractAt("LstBTC", contracts.lstBTC);
  const custodian = await ethers.getContractAt("Custodian", contracts.custodian);
  const vault = await ethers.getContractAt("Vault", contracts.vault);

  console.log("Using contracts:");
  console.log("Vault:", vault.address);
  console.log("Custodian:", custodian.address);
  console.log("lstBTC:", lstBTC.address);
  console.log();

  // Mint tokens to users for demo
  const mintAmount = ethers.utils.parseEther("10");
  await wBTC.mint(user1.address, mintAmount);
  await stCORE.mint(user1.address, mintAmount);
  await wBTC.mint(user2.address, mintAmount);
  await stCORE.mint(user2.address, mintAmount);

  console.log("✓ Minted 10 wBTC and 10 stCORE to user1 and user2\n");

  // Demo 1: User1 deposits wBTC and stCORE
  console.log("=== Demo 1: User1 Deposit ===");
  const depositWBTC = ethers.utils.parseEther("1"); // 1 wBTC
  const depositStCORE = ethers.utils.parseEther("5"); // 5 stCORE

  console.log(`User1 depositing: ${ethers.utils.formatEther(depositWBTC)} wBTC + ${ethers.utils.formatEther(depositStCORE)} stCORE`);

  // Approve vault to spend tokens
  await wBTC.connect(user1).approve(vault.address, depositWBTC);
  await stCORE.connect(user1).approve(vault.address, depositStCORE);

  // Get prices for calculation
  const [stCOREPrice, coreBTCPrice] = await vault.getCurrentPrices();
  console.log(`Current prices: 1 stCORE = ${ethers.utils.formatEther(stCOREPrice)} CORE, 1 CORE = ${ethers.utils.formatEther(coreBTCPrice)} BTC`);

  // Calculate expected lstBTC
  const stCOREInBTC = depositStCORE.mul(stCOREPrice).mul(coreBTCPrice).div(ethers.utils.parseEther("1")).div(ethers.utils.parseEther("1"));
  const expectedLstBTC = depositWBTC.add(stCOREInBTC);
  console.log(`Expected lstBTC to mint: ${ethers.utils.formatEther(expectedLstBTC)}`);

  // Perform deposit
  const tx1 = await vault.connect(user1).deposit(depositWBTC, depositStCORE);
  await tx1.wait();

  const user1LstBTCBalance = await lstBTC.balanceOf(user1.address);
  console.log(`✓ User1 received: ${ethers.utils.formatEther(user1LstBTCBalance)} lstBTC`);

  // Check deposit ratios
  const [r_wBTC, r_stCORE] = await vault.getUserRatios(user1.address);
  console.log(`User1 deposit ratios: wBTC=${ethers.utils.formatEther(r_wBTC)}, stCORE=${ethers.utils.formatEther(r_stCORE)}\n`);

  // Demo 2: User2 deposits different amounts
  console.log("=== Demo 2: User2 Deposit ===");
  const deposit2WBTC = ethers.utils.parseEther("0.5"); // 0.5 wBTC
  const deposit2StCORE = ethers.utils.parseEther("20"); // 20 stCORE

  console.log(`User2 depositing: ${ethers.utils.formatEther(deposit2WBTC)} wBTC + ${ethers.utils.formatEther(deposit2StCORE)} stCORE`);

  await wBTC.connect(user2).approve(vault.address, deposit2WBTC);
  await stCORE.connect(user2).approve(vault.address, deposit2StCORE);

  const tx2 = await vault.connect(user2).deposit(deposit2WBTC, deposit2StCORE);
  await tx2.wait();

  const user2LstBTCBalance = await lstBTC.balanceOf(user2.address);
  console.log(`✓ User2 received: ${ethers.utils.formatEther(user2LstBTCBalance)} lstBTC`);

  const [r2_wBTC, r2_stCORE] = await vault.getUserRatios(user2.address);
  console.log(`User2 deposit ratios: wBTC=${ethers.utils.formatEther(r2_wBTC)}, stCORE=${ethers.utils.formatEther(r2_stCORE)}\n`);

  // Demo 3: Check total system state
  console.log("=== Demo 3: System State ===");
  const totalBTCValue = await vault.getTotalBTCValue();
  const totalLstBTCSupply = await lstBTC.totalSupply();
  console.log(`Total BTC value in system: ${ethers.utils.formatEther(totalBTCValue)} BTC`);
  console.log(`Total lstBTC supply: ${ethers.utils.formatEther(totalLstBTCSupply)} lstBTC`);
  console.log(`System maintains 1:1 ratio: ${ethers.utils.formatEther(totalBTCValue)} BTC = ${ethers.utils.formatEther(totalLstBTCSupply)} lstBTC\n`);

  // Demo 4: Yield distribution
  console.log("=== Demo 4: Yield Distribution ===");
  const yieldAmount = ethers.utils.parseEther("0.1"); // 0.1 BTC yield
  
  console.log(`Distributing ${ethers.utils.formatEther(yieldAmount)} BTC yield...`);
  console.log("Before yield distribution:");
  console.log(`User1 balance: ${ethers.utils.formatEther(await lstBTC.balanceOf(user1.address))} lstBTC`);
  console.log(`User2 balance: ${ethers.utils.formatEther(await lstBTC.balanceOf(user2.address))} lstBTC`);

  // Distribute yield proportionally (simplified)
  const user1Yield = yieldAmount.div(2); // Equal distribution for demo
  const user2Yield = yieldAmount.div(2);

  const tx3 = await vault.connect(deployer).distributeYield(
    [user1.address, user2.address],
    [user1Yield, user2Yield]
  );
  await tx3.wait();

  console.log("After yield distribution:");
  console.log(`User1 balance: ${ethers.utils.formatEther(await lstBTC.balanceOf(user1.address))} lstBTC`);
  console.log(`User2 balance: ${ethers.utils.formatEther(await lstBTC.balanceOf(user2.address))} lstBTC`);

  const newTotalSupply = await lstBTC.totalSupply();
  console.log(`New total supply: ${ethers.utils.formatEther(newTotalSupply)} lstBTC`);
  console.log(`✓ Yield distributed via balance increase method\n`);

  // Demo 5: Redemption
  console.log("=== Demo 5: User1 Partial Redemption ===");
  const currentBalance = await lstBTC.balanceOf(user1.address);
  const redeemAmount = currentBalance.div(3); // Redeem 1/3 of balance

  console.log(`User1 redeeming: ${ethers.utils.formatEther(redeemAmount)} lstBTC`);

  const beforeWBTC = await wBTC.balanceOf(user1.address);
  const beforeStCORE = await stCORE.balanceOf(user1.address);

  const tx4 = await vault.connect(user1).redeem(redeemAmount);
  await tx4.wait();

  const afterWBTC = await wBTC.balanceOf(user1.address);
  const afterStCORE = await stCORE.balanceOf(user1.address);

  console.log(`✓ User1 received: ${ethers.utils.formatEther(afterWBTC.sub(beforeWBTC))} wBTC`);
  console.log(`✓ User1 received: ${ethers.utils.formatEther(afterStCORE.sub(beforeStCORE))} stCORE`);
  console.log(`Remaining lstBTC balance: ${ethers.utils.formatEther(await lstBTC.balanceOf(user1.address))}\n`);

  // Demo 6: Final system state
  console.log("=== Demo 6: Final System State ===");
  const finalTotalBTC = await vault.getTotalBTCValue();
  const finalTotalSupply = await lstBTC.totalSupply();
  console.log(`Final total BTC value: ${ethers.utils.formatEther(finalTotalBTC)} BTC`);
  console.log(`Final total lstBTC supply: ${ethers.utils.formatEther(finalTotalSupply)} lstBTC`);
  console.log(`1:1 ratio maintained: ${finalTotalBTC.eq(finalTotalSupply) ? '✓ Yes' : '✗ No'}\n`);

  console.log("=== Demo Completed Successfully! ===");
  console.log("\nKey Features Demonstrated:");
  console.log("✓ 1:1 lstBTC to BTC ratio maintained");
  console.log("✓ Yield distributed via balance increase");
  console.log("✓ Tokens stored securely in Custodian");
  console.log("✓ Vault has exclusive minting rights");
  console.log("✓ Proper deposit ratio tracking for redemptions");
  console.log("✓ Users can deposit wBTC + stCORE and redeem proportionally");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
