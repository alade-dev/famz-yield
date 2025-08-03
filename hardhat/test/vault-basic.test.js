const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("New Vault System - Basic", function () {
  let owner, user1;
  let wBTC, stCORE, lstBTC, custodian, vault;
  let mockPriceFeedStCORE, mockPriceFeedCORE;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 18);
    await wBTC.waitForDeployment();
    
    stCORE = await MockERC20.deploy("Staked CORE", "stCORE", 18);
    await stCORE.waitForDeployment();

    // Deploy mock price feeds
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    mockPriceFeedStCORE = await MockPriceFeed.deploy(ethers.parseEther("1.01"));
    await mockPriceFeedStCORE.waitForDeployment();
    
    mockPriceFeedCORE = await MockPriceFeed.deploy(ethers.parseEther("0.0001"));
    await mockPriceFeedCORE.waitForDeployment();

    // Deploy lstBTC token
    const LstBTCNew = await ethers.getContractFactory("LstBTCNew");
    lstBTC = await LstBTCNew.deploy(owner.address);
    await lstBTC.waitForDeployment();

    // Deploy Custodian
    const Custodian = await ethers.getContractFactory("Custodian");
    custodian = await Custodian.deploy(
      await wBTC.getAddress(),
      await stCORE.getAddress(),
      await lstBTC.getAddress(),
      await mockPriceFeedStCORE.getAddress(),
      await mockPriceFeedCORE.getAddress(),
      owner.address
    );
    await custodian.waitForDeployment();

    // Deploy Vault
    const VaultNew = await ethers.getContractFactory("VaultNew");
    vault = await VaultNew.deploy(
      await wBTC.getAddress(),
      await stCORE.getAddress(),
      await custodian.getAddress(),
      await lstBTC.getAddress(),
      owner.address
    );
    await vault.waitForDeployment();

    // Set up authorizations
    await custodian.setAuthorizedVault(await vault.getAddress());
    
    // The owner (deployer) needs to authorize the vault as minter, not the vault itself
    await lstBTC.setMinter(await vault.getAddress(), true);
    await lstBTC.setYieldDistributor(await vault.getAddress(), true);
    
    // Mint tokens to user for testing
    const mintAmount = ethers.parseEther("100");
    await wBTC.mint(user1.address, mintAmount);
    await stCORE.mint(user1.address, mintAmount);
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await vault.wBTC()).to.equal(await wBTC.getAddress());
      expect(await vault.stCORE()).to.equal(await stCORE.getAddress());
      expect(await vault.custodian()).to.equal(await custodian.getAddress());
      expect(await vault.lstBTC()).to.equal(await lstBTC.getAddress());
    });

    it("Should set up authorizations correctly", async function () {
      expect(await custodian.authorizedVault()).to.equal(await vault.getAddress());
      expect(await lstBTC.authorizedMinters(await vault.getAddress())).to.be.true;
      expect(await lstBTC.yieldDistributors(await vault.getAddress())).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should deposit wBTC and stCORE successfully", async function () {
      const wBTCAmount = ethers.parseEther("1"); // 1 wBTC
      const stCOREAmount = ethers.parseEther("10"); // 10 stCORE

      // Approve vault to spend tokens
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(await vault.getAddress(), stCOREAmount);

      // Perform deposit
      const tx = await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);
      await tx.wait();

      // Check lstBTC balance
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(lstBTCBalance).to.be.gt(ethers.parseEther("1")); // Should be more than 1 BTC

      // Check that tokens were transferred to custodian
      expect(await wBTC.balanceOf(await custodian.getAddress())).to.equal(wBTCAmount);
      expect(await stCORE.balanceOf(await custodian.getAddress())).to.equal(stCOREAmount);
    });
  });

  describe("Redemptions", function () {
    beforeEach(async function () {
      // Set up a deposit first
      const wBTCAmount = ethers.parseEther("1");
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(await vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);
    });

    it("Should redeem lstBTC for underlying assets", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const redeemAmount = lstBTCBalance / 2n; // Redeem half

      const tx = await vault.connect(user1).redeem(redeemAmount);
      await tx.wait();

      // Check that lstBTC was burned
      const newLstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(newLstBTCBalance).to.equal(lstBTCBalance - redeemAmount);

      // Check that user received tokens back
      const wBTCBalance = await wBTC.balanceOf(user1.address);
      const stCOREBalance = await stCORE.balanceOf(user1.address);
      
      expect(wBTCBalance).to.be.gt(0);
      expect(stCOREBalance).to.be.gt(0);
    });
  });
});
