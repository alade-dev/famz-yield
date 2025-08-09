const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("New Vault System - Basic", function () {
  let owner, user1;
  let wBTC, stCORE, lstBTC, custodian, vault, priceOracle;
  let CORE_NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Use this constant to represent CORE (native token)

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 8);
    await wBTC.waitForDeployment();
    
    stCORE = await MockERC20.deploy("Staked CORE", "stCORE", 18);
    await stCORE.waitForDeployment();

    // Deploy priceOracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();
    // Deploy lstBTC token
    const LstBTC = await ethers.getContractFactory("LstBTC");
    lstBTC = await LstBTC.deploy(owner.address);
    await lstBTC.waitForDeployment();

    // Deploy Custodian with new constructor
    const Custodian = await ethers.getContractFactory("Custodian");
    custodian = await Custodian.deploy(
      await wBTC.getAddress(),
      await stCORE.getAddress(),
      await lstBTC.getAddress(),
      await priceOracle.getAddress(),
      owner.address
    );
    await custodian.waitForDeployment();

    // Deploy Vault with new constructor
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(
      await wBTC.getAddress(),
      await custodian.getAddress(),
      await lstBTC.getAddress(),
      owner.address
    );
    await vault.waitForDeployment();
    // Whitelist stCORE as LST token (immediately after vault deployment)
    await vault.whitelistLST(await stCORE.getAddress(), true);

    // Set up authorizations
    await custodian.setAuthorizedVault(await vault.getAddress());
    await lstBTC.setMinter(await vault.getAddress(), true);
    await lstBTC.setYieldDistributor(await vault.getAddress(), true);

    // Mint tokens to user for testing
    const wBTCMintAmount = ethers.parseUnits("100", 8); // 100 wBTC (8 decimals)
    const stCOREMintAmount = ethers.parseEther("100"); // 100 stCORE (18 decimals)
    await wBTC.mint(user1.address, wBTCMintAmount);
    await stCORE.mint(user1.address, stCOREMintAmount);

    //set initial prices of corenative in price oracle
    await priceOracle.setPrice(CORE_NATIVE, ethers.parseEther("0.00000888")); // 1 CORE = 0.00000888 BTC
    await priceOracle.setPrice(await stCORE.getAddress(), ethers.parseEther("1.418023")); // 1 stCORE = 1.418023 BTC
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await vault.wBTC()).to.equal(await wBTC.getAddress());
      expect(await vault.custodian()).to.equal(await custodian.getAddress());
      expect(await vault.lstBTC()).to.equal(await lstBTC.getAddress());
      expect(await custodian.priceOracle()).to.equal(await priceOracle.getAddress());
    });

    it("Should set up authorizations correctly", async function () {
      expect(await custodian.authorizedVault()).to.equal(await vault.getAddress());
      expect(await lstBTC.authorizedMinters(await vault.getAddress())).to.be.true;
      expect(await lstBTC.yieldDistributors(await vault.getAddress())).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should deposit wBTC and stCORE successfully", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8); // 1 wBTC (8 decimals)
      const stCOREAmount = ethers.parseEther("10"); // 10 stCORE (18 decimals)

      // Approve vault to spend tokens
      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);

      // Perform deposit (pass stCORE address as lstToken)
      const tx = await vault.connect(user1).deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
      await tx.wait();

      // Check lstBTC balance
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(lstBTCBalance).to.be.gt(ethers.parseEther("1")); // Should be more than 1 BTC

      // Check that tokens were transferred to custodian
      expect(await wBTC.balanceOf(custodian.getAddress())).to.equal(wBTCAmount);
      expect(await stCORE.balanceOf(custodian.getAddress())).to.equal(stCOREAmount);
    });
  });

  describe("Redemptions", function () {
    beforeEach(async function () {
      // Set up a deposit first
      const wBTCAmount = ethers.parseUnits("1", 8); // 1 wBTC (8 decimals)
      const stCOREAmount = ethers.parseEther("10"); // 10 stCORE (18 decimals)

      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
    });

    it("Should redeem lstBTC for underlying assets", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      console.log("lstBTC Balance before redeem:", ethers.formatEther(lstBTCBalance));
      const redeemAmount = lstBTCBalance / 2n; // Redeem half

      const tx = await vault.connect(user1).redeem(redeemAmount, await stCORE.getAddress());
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
