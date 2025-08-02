const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Vault", function () {
  let owner, operator, user1, user2, feeReceiver;
  let vault, lstBTC, wbtc, custodian, earn;
  let MockLST; // Separate LST token like stBTC

  const depositWBTC = 100_000_000n; // 1 BTC in sats (8 decimals)
  const depositLST = ethers.parseEther("50"); // 50 stBTC

  beforeEach(async () => {
    [owner, operator, user1, user2, feeReceiver] = await ethers.getSigners();

    const depositWBTC = 100_000_000n; // 1 BTC in sats
    const depositLST = ethers.parseEther("50"); // 50 stBTC

    // Deploy LstBTC
    const LstBTCFactory = await ethers.getContractFactory("LstBTC");
    lstBTC = await LstBTCFactory.deploy(owner.address);
    await lstBTC.waitForDeployment();

    // Deploy MockWBTC
    const MockWBTCFactory = await ethers.getContractFactory("MockWBTC");
    wbtc = await MockWBTCFactory.deploy();
    await wbtc.waitForDeployment();

    // Deploy Mock Earn
    const MockEarnFactory = await ethers.getContractFactory("MockEarn");
    earn = await MockEarnFactory.deploy();
    await earn.waitForDeployment();

    // Deploy MockCustodianAdapter
    const MockCustodianFactory = await ethers.getContractFactory(
      "MockCustodianAdapter"
    );
    custodian = await MockCustodianFactory.deploy(owner.address);
    await custodian.waitForDeployment();

    // Deploy a mock LST token (e.g., stCore)
    const MockLSTFactory = await ethers.getContractFactory("MockERC20");
    MockLST = await MockLSTFactory.deploy("Staked Core", "stCore", 18);
    await MockLST.waitForDeployment();

    // Deploy Vault
    const VaultFactory = await ethers.getContractFactory("Vault");
    vault = await VaultFactory.deploy(
      await lstBTC.getAddress(),
      await custodian.getAddress(),
      await wbtc.getAddress(),
      await earn.getAddress(),
      owner.address
    );
    await vault.waitForDeployment();

    // Before updateYield
    //await earn.setStCoreBalance(ethers.parseEther("100"));

    // Set prices in custodian BEFORE any deposit
    await custodian.setVault(await vault.getAddress());
    await custodian.setBTCToCOREPrice(ethers.parseEther("234000")); // 234k CORE/BTC
    await custodian.setLSTPriceInCORE(
      await MockLST.getAddress(),
      ethers.parseEther("1.4")
    ); // 1.4 CORE/stCore

    // Post-deployment config
    await vault.setOperator(operator.address);
    await vault.whitelistLST(await MockLST.getAddress(), true);
    await vault.setFeeReceiver(feeReceiver.address);
    await vault.setCustodianAdapter(await custodian.getAddress());

    // Mint test tokens
    await wbtc.mint(user1.address, depositWBTC);
    await MockLST.mint(user1.address, depositLST);

    await lstBTC.transferOwnership(await vault.getAddress());
  });

  describe("Deployment", function () {
    it("Should set initial parameters correctly", async () => {
      expect(await vault.wBTC()).to.equal(await wbtc.getAddress());
      expect(await vault.custodianAdapter()).to.equal(
        await custodian.getAddress()
      );
      expect(await vault.operator()).to.equal(operator.address);
      expect(await vault.depositMinAmount()).to.equal(100n); // 0.000001 BTC
      expect(await vault.redeemMinAmount()).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Deposit", function () {
    beforeEach(async () => {
      await wbtc.connect(user1).approve(vault.target, depositWBTC);
      await MockLST.connect(user1).approve(vault.target, depositLST);
    });

    it("Should revert if LST is not whitelisted", async () => {
      await expect(
        vault.connect(user1).deposit(depositWBTC, depositLST, user1.address)
      ).to.be.revertedWith("LST not whitelisted");
    });

    it("Should revert if deposit is too small", async () => {
      await expect(
        vault.connect(user1).deposit(1n, 1n, await MockLST.getAddress())
      ).to.be.revertedWith("Deposit too small");
    });

    it("Should record deposit and mint lstBTC", async () => {
      await vault
        .connect(user1)
        .deposit(depositWBTC, depositLST, await MockLST.getAddress());

      const deposits = await vault.getUserDeposits(user1.address);
      expect(deposits.length).to.equal(1);
      expect(deposits[0].wbtcAmount).to.equal(depositWBTC);
      expect(deposits[0].lstTokenAmount).to.equal(depositLST);
      expect(deposits[0].lstToken).to.equal(await MockLST.getAddress());

      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(lstBTCBalance).to.be.gt(0);
    });

    it("Should emit DepositSuccessful event", async () => {
      await expect(
        vault
          .connect(user1)
          .deposit(depositWBTC, depositLST, await MockLST.getAddress())
      )
        .to.emit(vault, "DepositSuccessful")
        .withArgs(
          user1.address,
          depositWBTC,
          depositLST,
          await MockLST.getAddress(),
          anyValue
        );
    });
  });

  describe("Redeem", function () {
    beforeEach(async () => {
      await vault.setCustodianAdapter(await custodian.getAddress());
      await custodian.setVault(await vault.getAddress());

      // Approve
      await wbtc.connect(user1).approve(await vault.getAddress(), depositWBTC);
      await MockLST.connect(user1).approve(
        await vault.getAddress(),
        depositLST
      );

      // Perform deposit — this pulls tokens via transferFrom
      await vault
        .connect(user1)
        .deposit(depositWBTC, depositLST, await MockLST.getAddress());
    });

    it("Should revert if redeem amount is too small", async () => {
      await vault.setRedeemMinAmount(ethers.parseEther("10"));
      const userLstBTC = await lstBTC.balanceOf(user1.address);
      await expect(vault.connect(user1).redeem(userLstBTC)).to.be.revertedWith(
        "Too small"
      );
    });

    it("Should revert if insufficient lstBTC balance", async () => {
      const userLstBTC = await lstBTC.balanceOf(user1.address);
      await expect(vault.connect(user2).redeem(userLstBTC)).to.be.revertedWith(
        "Insufficient"
      );
    });

    it("Should redeem and transfer underlying assets", async () => {
      const userLstBTC = await lstBTC.balanceOf(user1.address);

      await expect(vault.connect(user1).redeem(userLstBTC))
        .to.emit(vault, "Redeem")
        .withArgs(user1.address, userLstBTC, anyValue, anyValue);

      expect(await lstBTC.balanceOf(user1.address)).to.equal(0);
      expect(await wbtc.balanceOf(user1.address)).to.be.gt(0);
      expect(await MockLST.balanceOf(user1.address)).to.be.gt(0);
    });
  });

  describe("Yield Update", function () {
    it("Should update exchange rate and emit event", async () => {
      // Simulate deposit
      await wbtc.connect(user1).approve(await vault.getAddress(), depositWBTC);
      await MockLST.connect(user1).approve(
        await vault.getAddress(),
        depositLST
      );
      await vault
        .connect(user1)
        .deposit(depositWBTC, depositLST, await MockLST.getAddress());

      // Set stCORE balance in MockEarn
      await earn.setStCoreBalance(ethers.parseEther("100"));

      // Increase exchange rate to simulate yield
      await earn.setExchangeRate(ethers.parseEther("1.05"));

      await expect(vault.connect(operator).updateYield())
        .to.emit(vault, "UpdateExchangeRate")
        .withArgs(anyValue);
    });

    it("Should collect protocol fee in ETH (CORE)", async () => {
      await vault.setProtocolFeePoints(10000); // 1%

      const feeBefore = await ethers.provider.getBalance(feeReceiver.address);

      // Send ETH to Vault (simulating CORE revenue)
      await operator.sendTransaction({
        to: vault.getAddress(),
        value: ethers.parseEther("10"),
      });

      // Now call updateYield — it should take 1% as fee
      await vault.connect(operator).updateYield();

      const feeAfter = await ethers.provider.getBalance(feeReceiver.address);
      expect(feeAfter - feeBefore).to.equal(ethers.parseEther("0.1")); // 1% of 10 ETH
    });
  });

  describe("Admin Functions", function () {
    it("Only owner can set fee receiver", async () => {
      await expect(
        vault.connect(user1).setFeeReceiver(user1.address)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
      await vault.setFeeReceiver(user1.address);
      expect(await vault.protocolFeeReceiver()).to.equal(user1.address);
    });

    it("Only owner can set protocol fee points", async () => {
      await expect(
        vault.connect(user1).setProtocolFeePoints(10000)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
      await vault.setProtocolFeePoints(50000); // 5%
      expect(await vault.protocolFeePoints()).to.equal(50000);
    });

    it("Only operator can update oracle prices", async () => {
      await expect(
        vault.connect(user1).updateOraclePrices(12000000000n, 50000000n)
      ).to.be.revertedWith("Not operator");
      await vault.connect(operator).updateOraclePrices(12000000000n, 50000000n);
      expect(await vault.wbtcPriceUSD()).to.equal(12000000000n);
      expect(await vault.corePriceUSD()).to.equal(50000000n);
    });
  });
});
