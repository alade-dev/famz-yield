const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("New Vault System", function () {
  let owner, user1, user2, operator, feeReceiver;
  let wBTC, stCORE, lstBTC, custodian, vault;
  let mockPriceFeedStCORE, mockPriceFeedCORE;

  const SCALE = ethers.parseEther("1"); // 1e18
  const WBTC_DECIMALS = 18; // For testing, we'll use 18 decimals
  const STCORE_DECIMALS = 18;

  beforeEach(async function () {
    [owner, user1, user2, operator, feeReceiver] = await ethers.getSigners();

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
    await custodian.setAuthorizedVault(vault.getAddress());
    //await vault.authorizeMinting();
    await vault.setOperator(operator.address);
    await vault.setFeeReceiver(feeReceiver.address);
    await lstBTC.setMinter(await vault.getAddress(), true);
    await lstBTC.setYieldDistributor(await vault.getAddress(), true);

    // Mint tokens to users for testing
    const mintAmount = ethers.parseEther("100"); // 100 tokens each
    await wBTC.mint(user1.address, mintAmount);
    await stCORE.mint(user1.address, mintAmount);
    await wBTC.mint(user2.address, mintAmount);
    await stCORE.mint(user2.address, mintAmount);


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
      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);

      // Calculate expected lstBTC minted
      // stCORE in BTC = 10 * 1.01 * 0.0001 = 0.00101 BTC
      // Total BTC value = 1 + 0.00101 = 1.00101 BTC
      const expectedLstBTC = ethers.parseEther("1.00101");

      const tx = await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);
      
      await expect(tx)
        .to.emit(vault, "DepositSuccessful")
        .withArgs(user1.address, wBTCAmount, stCOREAmount, expectedLstBTC);

      // Check lstBTC balance
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(lstBTCBalance).to.be.closeTo(expectedLstBTC, ethers.parseEther("0.001"));

      // Check that tokens were transferred to custodian
      expect(await wBTC.balanceOf(custodian.getAddress())).to.equal(wBTCAmount);
      expect(await stCORE.balanceOf(custodian.getAddress())).to.equal(stCOREAmount);
    });

    it("Should calculate correct deposit ratios", async function () {
      const wBTCAmount = ethers.parseEther("1");
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);

      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);

      const [r_wBTC, r_stCORE] = await vault.getUserRatios(user1.address);
      
      // wBTC ratio should be ~99.9% (1 BTC out of 1.00101 total)
      // stCORE ratio should be ~0.1% (0.00101 BTC out of 1.00101 total)
      expect(r_wBTC).to.be.closeTo(ethers.parseEther("0.999"), ethers.parseEther("0.001"));
      expect(r_stCORE).to.be.closeTo(ethers.parseEther("0.001"), ethers.parseEther("0.001"));
    });

    it("Should revert if deposit is below minimum", async function () {
      const smallAmount = ethers.parseEther("0.0001"); // Very small amount

      await wBTC.connect(user1).approve(vault.getAddress(), smallAmount);

      await expect(
        vault.connect(user1).deposit(smallAmount, 0)
      ).to.be.revertedWith("Deposit below minimum");
    });
  });

  describe("Redemptions", function () {
    beforeEach(async function () {
      // Set up a deposit first
      const wBTCAmount = ethers.parseEther("1");
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);
    });

    it("Should redeem lstBTC for underlying assets", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const redeemAmount = lstBTCBalance.div(2); // Redeem half

      const tx = await vault.connect(user1).redeem(redeemAmount);

      await expect(tx).to.emit(vault, "RedeemSuccessful");

      // Check that lstBTC was burned
      const newLstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(newLstBTCBalance).to.equal(lstBTCBalance.sub(redeemAmount));

      // Check that user received tokens back
      const wBTCBalance = await wBTC.balanceOf(user1.address);
      const stCOREBalance = await stCORE.balanceOf(user1.address);
      
      expect(wBTCBalance).to.be.gt(0);
      expect(stCOREBalance).to.be.gt(0);
    });

    it("Should revert if redeem amount is below minimum", async function () {
      const smallAmount = ethers.parseEther("0.0001");

      await expect(
        vault.connect(user1).redeem(smallAmount)
      ).to.be.revertedWith("Below minimum redeem amount");
    });

    it("Should revert if user has insufficient lstBTC", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const excessiveAmount = lstBTCBalance.add(ethers.parseEther("1"));

      await expect(
        vault.connect(user1).redeem(excessiveAmount)
      ).to.be.revertedWith("Insufficient lstBTC balance");
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      // Set up deposits from multiple users
      const wBTCAmount = ethers.parseEther("1");
      const stCOREAmount = ethers.parseEther("10");

      // User1 deposit
      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);

      // User2 deposit
      await wBTC.connect(user2).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user2).approve(vault.getAddress(), stCOREAmount);
      await vault.connect(user2).deposit(wBTCAmount, stCOREAmount);
    });

    it("Should distribute yield to users", async function () {
      const yieldAmount = ethers.parseEther("0.1"); // 0.1 BTC yield
      
      const initialBalance1 = await lstBTC.balanceOf(user1.address);
      const initialBalance2 = await lstBTC.balanceOf(user2.address);

      const tx = await vault.connect(operator).distributeYield(
        [user1.address, user2.address],
        [yieldAmount.div(2), yieldAmount.div(2)]
      );

      await expect(tx).to.emit(vault, "YieldDistributed");

      // Check that balances increased
      const newBalance1 = await lstBTC.balanceOf(user1.address);
      const newBalance2 = await lstBTC.balanceOf(user2.address);

      expect(newBalance1).to.equal(initialBalance1.add(yieldAmount.div(2)));
      expect(newBalance2).to.equal(initialBalance2.add(yieldAmount.div(2)));
    });

    it("Should only allow operator to distribute yield", async function () {
      const yieldAmount = ethers.parseEther("0.1");

      await expect(
        vault.connect(user1).distributeYield([user1.address], [yieldAmount])
      ).to.be.revertedWith("Not operator");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set operator", async function () {
      const newOperator = user2.address;

      await vault.setOperator(newOperator);
      expect(await vault.operator()).to.equal(newOperator);
    });

    it("Should allow owner to set fee receiver", async function () {
      const newFeeReceiver = user2.address;

      await vault.setFeeReceiver(newFeeReceiver);
      expect(await vault.protocolFeeReceiver()).to.equal(newFeeReceiver);
    });

    it("Should allow owner to set minimum amounts", async function () {
      const newDepositMin = ethers.parseEther("0.01");
      const newRedeemMin = ethers.parseEther("0.01");

      await vault.setMinimumAmounts(newDepositMin, newRedeemMin);
      
      expect(await vault.depositMinAmount()).to.equal(newDepositMin);
      expect(await vault.redeemMinAmount()).to.equal(newRedeemMin);
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        vault.connect(user1).setOperator(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const wBTCAmount = ethers.parseEther("1");
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(vault.getAddress(), wBTCAmount);
      await stCORE.connect(user1).approve(vault.getAddress(), stCOREAmount);
      await vault.connect(user1).deposit(wBTCAmount, stCOREAmount);
    });

    it("Should return correct total BTC value", async function () {
      const totalBTCValue = await vault.getTotalBTCValue();
      expect(totalBTCValue).to.be.gt(ethers.parseEther("1"));
    });

    it("Should return current oracle prices", async function () {
      const [stCOREPrice, coreBTCPrice] = await vault.getCurrentPrices();
      expect(stCOREPrice).to.equal(ethers.parseEther("1.01"));
      expect(coreBTCPrice).to.equal(ethers.parseEther("0.0001"));
    });

    it("Should return user info correctly", async function () {
      const [balance, btcValue] = await vault.getUserInfo(user1.address);
      expect(balance).to.equal(btcValue); // 1:1 ratio
      expect(balance).to.be.gt(0);
    });
  });

  describe("Fee Collection", function () {
    it("Should collect fees when contract has balance", async function () {
      // Send some ETH to the contract
      const feeAmount = ethers.parseEther("0.1");
      await owner.sendTransaction({
        to: vault.getAddress(),
        value: feeAmount
      });

      const initialBalance = await ethers.provider.getBalance(feeReceiver.address);
      await vault.collectFees();
      
      const finalBalance = await ethers.provider.getBalance(feeReceiver.address);
      expect(finalBalance.sub(initialBalance)).to.equal(feeAmount);
    });

    it("Should revert fee collection if no fee receiver is set", async function () {
      // Set fee receiver to zero address
      await vault.setFeeReceiver(feeReceiver.address);
      await vault.setFeeReceiver(ethers.ZeroAddress);

      await expect(vault.collectFees()).to.be.revertedWith("Fee receiver not set");
    });
  });
});
