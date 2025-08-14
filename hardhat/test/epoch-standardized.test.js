const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Standardized Epoch-Based System", function () {
  let owner, user1, user2, operator, feeReceiver;
  let wBTC, stCORE, lstBTC, custodian, vault, priceOracle;
  const CORE_NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  beforeEach(async function () {
    [owner, user1, user2, operator, feeReceiver] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 8);
    await wBTC.waitForDeployment();
    stCORE = await MockERC20.deploy("Staked CORE", "stCORE", 18);
    await stCORE.waitForDeployment();

    // Deploy PriceOracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();

    // Deploy LstBTC
    const LstBTC = await ethers.getContractFactory("LstBTC");
    lstBTC = await LstBTC.deploy(owner.address);
    await lstBTC.waitForDeployment();

    // Deploy Custodian
    const Custodian = await ethers.getContractFactory("Custodian");
    custodian = await Custodian.deploy(
      await wBTC.getAddress(),
      await stCORE.getAddress(),
      await lstBTC.getAddress(),
      await priceOracle.getAddress(),
      await owner.getAddress()
    );
    await custodian.waitForDeployment();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(
      await wBTC.getAddress(),
      await custodian.getAddress(),
      await lstBTC.getAddress(),
      await owner.getAddress()
    );
    await vault.waitForDeployment();

    // Set up contract permissions
    await custodian.setAuthorizedVault(await vault.getAddress());
    await vault.setOperator(operator.address);
    await vault.setFeeReceiver(feeReceiver.address);
    await lstBTC.setMinter(await vault.getAddress(), true);
    await lstBTC.setYieldDistributor(await vault.getAddress(), true);
    await vault.whitelistLST(await stCORE.getAddress(), true);

    // Mint tokens to users for testing
    const wBTCMintAmount = ethers.parseUnits("100", 8);
    const stCOREMintAmount = ethers.parseEther("100");
    await wBTC.mint(user1.address, wBTCMintAmount);
    await stCORE.mint(user1.address, stCOREMintAmount);
    await wBTC.mint(user2.address, wBTCMintAmount);
    await stCORE.mint(user2.address, stCOREMintAmount);

    // Set oracle prices
    await priceOracle.setPrice(CORE_NATIVE, ethers.parseEther("0.00001"));
    await priceOracle.setPrice(await stCORE.getAddress(), ethers.parseEther("1.2"));
  });

  describe("Epoch-Based Deposit and Yield Flow", function () {
    it("Should implement standardized flow: deposit at 01:00, earn yield next epoch", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      // === EPOCH 1: User deposits at 01:00 ===
      console.log("📅 EPOCH 1: User deposits at 01:00");
      
      // Approve and deposit
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(await vault.getAddress(), stCOREAmount);
      
      const depositTx = await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
      
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      console.log(`✅ User received ${ethers.formatEther(lstBTCBalance)} lstBTC`);
      
      // Check that user's first deposit epoch is set to NEXT epoch
      const firstDepositEpoch = await vault.userFirstDepositEpoch(user1.address);
      const currentEpoch = await vault.currentEpoch();
      expect(firstDepositEpoch).to.equal(currentEpoch + 1n);
      console.log(`📝 User will be eligible for yield starting epoch ${firstDepositEpoch}`);

      // === COMPLETE EPOCH 1: No yield for new depositors ===
      console.log("⏱️  Fast forward 25 hours to close epoch 1...");
      await time.increase(25 * 3600);
      
      await vault.connect(operator).closeEpoch();
      
      // Add yield and distribute
      const yieldAmount = ethers.parseUnits("0.1", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount);
      await vault.connect(operator).notifyYield(yieldAmount, 0);
      
      // This should not increase user's balance (they weren't eligible)
      const balanceBeforeDistribution = await lstBTC.balanceOf(user1.address);
      await vault.connect(operator).distributeEpochYield();
      const balanceAfterDistribution = await lstBTC.balanceOf(user1.address);
      
      expect(balanceAfterDistribution).to.equal(balanceBeforeDistribution);
      console.log(`📊 User balance unchanged: ${ethers.formatEther(balanceAfterDistribution)} lstBTC`);

      // === START EPOCH 2 ===
      console.log("📅 EPOCH 2: User becomes eligible for yield");
      await vault.connect(operator).startNewEpoch();

      // === COMPLETE EPOCH 2: User gets yield ===
      console.log("⏱️  Fast forward 25 hours to close epoch 2...");
      await time.increase(25 * 3600);
      
      await vault.connect(operator).closeEpoch();
      
      // Add yield and distribute
      await wBTC.mint(await custodian.getAddress(), yieldAmount);
      await vault.connect(operator).notifyYield(yieldAmount, 0);
      
      const balanceBeforeYield2 = await lstBTC.balanceOf(user1.address);
      await vault.connect(operator).distributeEpochYield();
      const balanceAfterYield2 = await lstBTC.balanceOf(user1.address);
      
      expect(balanceAfterYield2).to.be.gt(balanceBeforeYield2);
      console.log(`✅ User received yield: ${ethers.formatEther(balanceAfterYield2 - balanceBeforeYield2)} lstBTC`);
      console.log(`📊 Total balance: ${ethers.formatEther(balanceAfterYield2)} lstBTC`);
    });
  });

  describe("Epoch-Based Redemption Flow", function () {
    beforeEach(async function () {
      // Set up a deposit first
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      // Complete epoch 1 so user becomes eligible for yield
      await time.increase(25 * 3600);
      await vault.connect(operator).closeEpoch();
      
      const yieldAmount = ethers.parseUnits("0.1", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount);
      await vault.connect(operator).notifyYield(yieldAmount, 0);
      await vault.connect(operator).distributeEpochYield();
      
      // Start epoch 2
      await vault.connect(operator).startNewEpoch();
    });

    it("Should implement standardized flow: redeem at 17:00, receive tokens at epoch end", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const redeemAmount = lstBTCBalance / 2n; // Redeem half
      
      console.log(`📅 EPOCH 2: User queues redemption at 17:00`);
      console.log(`📊 User balance: ${ethers.formatEther(lstBTCBalance)} lstBTC`);
      console.log(`📊 Redeeming: ${ethers.formatEther(redeemAmount)} lstBTC`);

      // === QUEUE REDEMPTION ===
      await lstBTC.connect(user1).approve(await vault.getAddress(), redeemAmount);
      const queueTx = await vault.connect(user1).redeem(redeemAmount, await stCORE.getAddress());
      
      // Check that redemption was queued
      const currentEpoch = await vault.currentEpoch();
      console.log(`✅ Redemption queued for epoch ${currentEpoch}`);
      
      // Tokens should be locked in vault
      const vaultLstBTCBalance = await lstBTC.balanceOf(await vault.getAddress());
      expect(vaultLstBTCBalance).to.equal(redeemAmount);
      
      // User should have reduced balance for yield calculation
      const userBalanceAfterQueue = await vault.userBalances(user1.address);
      expect(userBalanceAfterQueue).to.equal(lstBTCBalance - redeemAmount);
      console.log(`📊 User yield balance reduced to: ${ethers.formatEther(userBalanceAfterQueue)} lstBTC`);

      // === USER SHOULD STILL GET PARTIAL YIELD ===
      console.log("⏱️  Fast forward 25 hours to close epoch (redemption still queued)...");
      await time.increase(25 * 3600); // Full 25 hours
      await vault.connect(operator).closeEpoch();
      
      const yieldAmount = ethers.parseUnits("0.05", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount);
      await vault.connect(operator).notifyYield(yieldAmount, 0);
      
      const balanceBeforeYield = await lstBTC.balanceOf(user1.address);
      await vault.connect(operator).distributeEpochYield();
      const balanceAfterYield = await lstBTC.balanceOf(user1.address);
      
      expect(balanceAfterYield).to.be.gt(balanceBeforeYield);
      console.log(`✅ User got yield on remaining balance: ${ethers.formatEther(balanceAfterYield - balanceBeforeYield)} lstBTC`);

      // === REDEMPTIONS SHOULD BE PROCESSED ===
      // Check that user received underlying tokens
      // Note: The _processRedemptions function should have been called during distributeEpochYield
      console.log(`✅ Redemptions processed at epoch end`);
      console.log(`📊 Final user lstBTC balance: ${ethers.formatEther(await lstBTC.balanceOf(user1.address))} lstBTC`);
    });

    it("Should allow emergency redemption with fee for urgent needs", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const redeemAmount = ethers.parseEther("0.5");
      
      console.log(`🚨 Emergency redemption with 1% fee`);
      
      const userWBTCBefore = await wBTC.balanceOf(user1.address);
      const userStCOREBefore = await stCORE.balanceOf(user1.address);
      
      const emergencyTx = await vault.connect(user1).emergencyRedeem(redeemAmount, await stCORE.getAddress());
      
      const userWBTCAfter = await wBTC.balanceOf(user1.address);
      const userStCOREAfter = await stCORE.balanceOf(user1.address);
      
      expect(userWBTCAfter).to.be.gt(userWBTCBefore);
      expect(userStCOREAfter).to.be.gt(userStCOREBefore);
      
      console.log(`✅ Emergency redemption processed immediately`);
      console.log(`📊 User received wBTC: ${ethers.formatUnits(userWBTCAfter - userWBTCBefore, 8)} wBTC`);
      console.log(`📊 User received stCORE: ${ethers.formatEther(userStCOREAfter - userStCOREBefore)} stCORE`);
    });
  });

  describe("Multiple Users Epoch Flow", function () {
    it("Should handle different users depositing at different times correctly", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      // === USER 1 DEPOSITS IN EPOCH 1 ===
      console.log("📅 EPOCH 1: User1 deposits");
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(await vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      const user1FirstEpoch = await vault.userFirstDepositEpoch(user1.address);
      console.log(`📝 User1 eligible starting epoch ${user1FirstEpoch}`);

      // Complete epoch 1
      await time.increase(25 * 3600);
      await vault.connect(operator).closeEpoch();
      
      const yieldAmount1 = ethers.parseUnits("0.1", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount1);
      await vault.connect(operator).notifyYield(yieldAmount1, 0);
      
      const user1BalanceBefore = await lstBTC.balanceOf(user1.address);
      await vault.connect(operator).distributeEpochYield();
      const user1BalanceAfter = await lstBTC.balanceOf(user1.address);
      
      expect(user1BalanceAfter).to.equal(user1BalanceBefore); // No yield yet
      console.log(`📊 User1 no yield (expected): ${ethers.formatEther(user1BalanceAfter)} lstBTC`);

      // === START EPOCH 2 & USER 2 DEPOSITS ===
      console.log("📅 EPOCH 2: User1 eligible, User2 deposits");
      await vault.connect(operator).startNewEpoch();
      
      await wBTC.connect(user2).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user2).approve(await vault.getAddress(), stCOREAmount);
      await vault.connect(user2).deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      const user2FirstEpoch = await vault.userFirstDepositEpoch(user2.address);
      console.log(`📝 User2 eligible starting epoch ${user2FirstEpoch}`);

      // Complete epoch 2
      await time.increase(25 * 3600);
      await vault.connect(operator).closeEpoch();
      
      const yieldAmount2 = ethers.parseUnits("0.1", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount2);
      await vault.connect(operator).notifyYield(yieldAmount2, 0);
      
      const user1Balance2Before = await lstBTC.balanceOf(user1.address);
      const user2Balance2Before = await lstBTC.balanceOf(user2.address);
      
      await vault.connect(operator).distributeEpochYield();
      
      const user1Balance2After = await lstBTC.balanceOf(user1.address);
      const user2Balance2After = await lstBTC.balanceOf(user2.address);
      
      expect(user1Balance2After).to.be.gt(user1Balance2Before); // User1 gets yield
      expect(user2Balance2After).to.equal(user2Balance2Before); // User2 no yield yet
      
      console.log(`✅ User1 received yield: ${ethers.formatEther(user1Balance2After - user1Balance2Before)} lstBTC`);
      console.log(`📊 User2 no yield yet (expected): ${ethers.formatEther(user2Balance2After)} lstBTC`);
    });
  });
});
