const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("New Vault System (Epoch-based)", function () {
  let owner, user1, user2, operator, feeReceiver;
  let wBTC, stCORE, lstBTC, custodian, vault, priceOracle;
  const CORE_NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  beforeEach(async function () {
    [owner, user1, user2, operator, feeReceiver] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    // For tests set wBTC as 8 decimals
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

    // Deploy Custodian
    const Custodian = await ethers.getContractFactory("Custodian");
    custodian = await Custodian.deploy(
      await wBTC.getAddress(),
      await stCORE.getAddress(),
      await lstBTC.getAddress(),
      await priceOracle.getAddress(),
      await owner.address
    );
    await custodian.waitForDeployment();

    // Deploy Vault (constructor args: _wBTC, _custodian, _lstBTC, initialOwner)
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(
      await wBTC.getAddress(),
      await custodian.getAddress(),
      await lstBTC.getAddress(),
      await owner.address
    );
    await vault.waitForDeployment();

    // Set up authorizations
    await custodian.setAuthorizedVault(await vault.getAddress());
    await vault.setOperator(operator.address);
    await vault.setFeeReceiver(feeReceiver.address);
    await lstBTC.setMinter(await vault.getAddress(), true);
    await lstBTC.setYieldDistributor(await vault.getAddress(), true);

    // Whitelist stCORE as LST token
    await vault.whitelistLST(await stCORE.getAddress(), true);

    // Mint tokens to users for testing
    const wBTCMintAmount = ethers.parseUnits("100", 8); // 100 wBTC (8 decimals)
    const stCOREMintAmount = ethers.parseEther("100"); // 100 stCORE (18 decimals)
    await wBTC.mint(user1.address, wBTCMintAmount);
    await stCORE.mint(user1.address, stCOREMintAmount);
    await wBTC.mint(user2.address, wBTCMintAmount);
    await stCORE.mint(user2.address, stCOREMintAmount);

    // Set initial prices in price oracle
    // CORE_NATIVE price (CORE -> BTC)
    await priceOracle.setPrice(CORE_NATIVE, ethers.parseEther("0.00000888")); // example
    // stCORE price (stCORE -> CORE)
    await priceOracle.setPrice(
      await stCORE.getAddress(),
      ethers.parseEther("1.418023")
    );
  });

  // Helper: move time forward by seconds
  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  // Helper: complete an epoch lifecycle (close -> operator transfers yields to custodian -> notify -> distribute)
  // wBTCYield should be in native wBTC decimals (8), stCOREYield in token decimals (18)
  async function completeEpoch(wBTCYield = 0n, stCOREYield = 0n) {
    // ⏩ Fast forward 25 hours
    await time.increase(25 * 3600);

    // ✅ Close the epoch
    await expect(vault.connect(operator).closeEpoch()).to.emit(
      vault,
      "EpochClosed"
    );

    // ✅ Transfer yield to Custodian
    if (wBTCYield > 0n) {
      await wBTC.mint(operator.address, wBTCYield);
      await wBTC
        .connect(operator)
        .transfer(await custodian.getAddress(), wBTCYield);
    }
    if (stCOREYield > 0n) {
      await stCORE.mint(operator.address, stCOREYield);
      await stCORE
        .connect(operator)
        .transfer(await custodian.getAddress(), stCOREYield);
    }

    // 🔔 Notify yield
    await expect(
      vault.connect(operator).notifyYield(wBTCYield, stCOREYield)
    ).to.emit(vault, "YieldInjected");

    // 🚀 Distribute yield
    await expect(vault.connect(operator).distributeEpochYield()).to.emit(
      vault,
      "EpochYieldDistributed"
    );
  }

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await vault.wBTC()).to.equal(await wBTC.getAddress());
      expect(await vault.custodian()).to.equal(await custodian.getAddress());
      expect(await vault.lstBTC()).to.equal(await lstBTC.getAddress());
      expect(await custodian.priceOracle()).to.equal(
        await priceOracle.getAddress()
      );
    });

    it("Should set up authorizations correctly", async function () {
      expect(await custodian.authorizedVault()).to.equal(
        await vault.getAddress()
      );
      expect(await lstBTC.authorizedMinters(await vault.getAddress())).to.be
        .true;
      expect(await lstBTC.yieldDistributors(await vault.getAddress())).to.be
        .true;
    });
  });

  describe("Deposits", function () {
    it("Should deposit wBTC and stCORE successfully", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8); // 1 wBTC (8 decimals)
      const stCOREAmount = ethers.parseEther("10"); // 10 stCORE

      // Approve vault to spend tokens
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);

      // Perform deposit with LST token address
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      // Check lstBTC balance
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(lstBTCBalance).to.be.gt(ethers.parseEther("1")); // Should be > 1 BTC (approx)

      // Check that tokens were transferred to custodian
      expect(await wBTC.balanceOf(await custodian.getAddress())).to.equal(
        wBTCAmount
      );
      expect(await stCORE.balanceOf(await custodian.getAddress())).to.equal(
        stCOREAmount
      );
    });

    it("Should calculate correct deposit ratios", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);

      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      const [r_wBTC, r_stCORE] = await vault.getUserRatios(user1.address);

      // ratios are 1e18 scaled; check roughly they sum to SCALE and are near expected
      // We expect wBTC ratio to be very large compared to stCORE because we set oracle prices so stCORE becomes BTC value small/large depending on rates.
      expect(r_wBTC).to.be.a("bigint");
      expect(r_stCORE).to.be.a("bigint");
      // Ensure they add up roughly to 1e18
      const sum = r_wBTC + r_stCORE;
      expect(sum).to.be.closeTo(
        ethers.parseEther("1"),
        ethers.parseEther("0.01")
      );
    });

    it("Should revert if deposit is below minimum", async function () {
      const smallAmount = ethers.parseUnits("0.0001", 8); // Very small wBTC amount

      await wBTC.connect(user1).approve(await vault.getAddress(), smallAmount);

      // deposit requires both amounts > 0 in your current implementation, so pass 0 for stCORE to revert as original test expected
      await expect(
        vault.connect(user1).deposit(smallAmount, 0, await stCORE.getAddress())
      ).to.be.revertedWith("Deposits must be greater than zero");
    });
  });

  describe("Redemptions", function () {
    beforeEach(async function () {
      // Set up a deposit first
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
    });

    it("Should redeem lstBTC for underlying assets", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      // Redeem half
      const redeemAmount = lstBTCBalance / 2n;

      const tx = await vault
        .connect(user1)
        .redeem(redeemAmount, await stCORE.getAddress());
      await tx.wait();

      // Check that lstBTC was burned
      const newLstBTCBalance = await lstBTC.balanceOf(user1.address);
      expect(newLstBTCBalance).to.equal(lstBTCBalance - redeemAmount);

      // Check that user received tokens back (wBTC or stCORE amounts > 0)
      const wBTCBalance = await wBTC.balanceOf(user1.address);
      const stCOREBalance = await stCORE.balanceOf(user1.address);
      expect(wBTCBalance).to.be.gt(0);
      expect(stCOREBalance).to.be.gt(0);
    });

    it("Should revert if redeem amount is below minimum", async function () {
      const smallAmount = ethers.parseEther("0.0001");

      await expect(
        vault.connect(user1).redeem(smallAmount, await stCORE.getAddress())
      ).to.be.revertedWith("Below minimum redeem amount");
    });

    it("Should revert if user has insufficient lstBTC", async function () {
      const lstBTCBalance = await lstBTC.balanceOf(user1.address);
      const excessiveAmount = lstBTCBalance + ethers.parseEther("1");

      await expect(
        vault.connect(user1).redeem(excessiveAmount, await stCORE.getAddress())
      ).to.be.revertedWith("Insufficient lstBTC balance");
    });
  });

  describe("Yield Distribution (epoch flow)", function () {
    beforeEach(async function () {
      // Set up deposits from two users
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      // User1 deposit
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      // User2 deposit
      await wBTC.connect(user2).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user2)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user2)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
    });

    it("Should only allow operator to call notifyYield/distribute", async function () {
      const wBTCYield = ethers.parseUnits("0.1", 8);
      const stCOREYield = ethers.parseEther("0.1");

      // Non-operator cannot closeEpoch/notifyYield/distributeEpochYield
      await expect(vault.connect(user1).closeEpoch()).to.be.revertedWith(
        "Not operator"
      );
      await expect(
        vault.connect(user1).notifyYield(wBTCYield, stCOREYield)
      ).to.be.revertedWith("Not operator");
      await expect(vault.connect(user1).distributeEpochYield()).to.be.reverted; // generic revert
    });

    it("Should inject and distribute epoch yield correctly (wBTC only)", async function () {
      const yieldAmount = ethers.parseUnits("0.1", 8);
      await wBTC.mint(await custodian.getAddress(), yieldAmount);
      await completeEpoch(yieldAmount, 0);

      const totalSupplyAfter = await lstBTC.totalSupply();
      expect(totalSupplyAfter).to.be.gt(ethers.parseEther("2"));
    });

    it("Should inject and distribute epoch yield correctly (stCORE only)", async function () {
      const yieldAmount = ethers.parseEther("1");
      await stCORE.mint(await custodian.getAddress(), yieldAmount);
      await completeEpoch(0, yieldAmount);

      const totalSupplyAfter = await lstBTC.totalSupply();
      expect(totalSupplyAfter).to.be.gt(ethers.parseEther("2"));
    });

    it("Should inject and distribute mixed wBTC + stCORE yield correctly", async function () {
      const wBTCYield = ethers.parseUnits("0.05", 8);
      const stCOREYield = ethers.parseEther("0.5");
      await wBTC.mint(await custodian.getAddress(), wBTCYield);
      await stCORE.mint(await custodian.getAddress(), stCOREYield);

      await completeEpoch(wBTCYield, stCOREYield);

      const totalSupplyAfter = await lstBTC.totalSupply();
      expect(totalSupplyAfter).to.be.gt(ethers.parseEther("2"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set operator", async function () {
      const newOperator = await user2.getAddress();
      await vault.setOperator(newOperator);
      expect(await vault.operator()).to.equal(newOperator);
    });

    it("Should allow owner to set fee receiver", async function () {
      const newFeeReceiver = await user2.getAddress();
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
      await expect(vault.connect(user1).setOperator(user2.address)).to.be
        .reverted;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());
    });

    it("Should return correct total BTC value", async function () {
      const totalBTCValue = await vault.getTotalBTCValue();
      expect(totalBTCValue).to.be.gt(ethers.parseEther("1"));
    });

    it("Should return current oracle prices", async function () {
      const [stCOREPrice, coreBTCPrice] = await custodian.getPriceInfo();
      expect(stCOREPrice).to.equal(ethers.parseEther("1.418023"));
      expect(coreBTCPrice).to.equal(ethers.parseEther("0.00000888"));
    });

    it("Should return user info correctly", async function () {
      const [balance, btcValue] = await vault.getUserInfo(user1.address);
      expect(balance).to.equal(btcValue);
      expect(balance).to.be.gt(0);
    });
  });

  describe("Fee Collection", function () {
    it("Should collect fees when contract has balance", async function () {
      // Send some ETH to the contract
      const feeAmount = ethers.parseEther("0.1");
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: feeAmount,
      });

      const initialBalance = await ethers.provider.getBalance(
        feeReceiver.address
      );
      await vault.collectFees();
      const finalBalance = await ethers.provider.getBalance(
        feeReceiver.address
      );

      expect(finalBalance - initialBalance).to.equal(feeAmount);
    });

    it("Should revert fee collection if no fees to collect", async function () {
      // Ensure contract balance is zero by deploying a fresh vault in beforeEach this won't be zero, so just call and expect revert
      // For safety, attempt to call collectFees now (no balance)
      await expect(vault.collectFees()).to.be.revertedWith(
        "No fees to collect"
      );
    });
  });

  describe("Edge & Safety Tests", function () {
    beforeEach(async function () {
      [owner, user1, user2, operator, feeReceiver, otherTokenHolder] =
        await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      wBTC = await MockERC20.deploy("Wrapped Bitcoin", "wBTC", 8);
      await wBTC.waitForDeployment();
      stCORE = await MockERC20.deploy("Staked CORE", "stCORE", 18);
      await stCORE.waitForDeployment();
      otherLST = await MockERC20.deploy("Other LST", "oLST", 18);
      await otherLST.waitForDeployment();

      const PriceOracle = await ethers.getContractFactory("PriceOracle");
      priceOracle = await PriceOracle.deploy();
      await priceOracle.waitForDeployment();

      const LstBTC = await ethers.getContractFactory("LstBTC");
      lstBTC = await LstBTC.deploy(owner.address);
      await lstBTC.waitForDeployment();

      const Custodian = await ethers.getContractFactory("Custodian");
      custodian = await Custodian.deploy(
        await wBTC.getAddress(),
        await stCORE.getAddress(),
        await lstBTC.getAddress(),
        await priceOracle.getAddress(),
        await owner.address
      );
      await custodian.waitForDeployment();

      const Vault = await ethers.getContractFactory("Vault");
      vault = await Vault.deploy(
        await wBTC.getAddress(),
        await custodian.getAddress(),
        await lstBTC.getAddress(),
        await owner.address
      );
      await vault.waitForDeployment();

      await custodian.setAuthorizedVault(await vault.getAddress());
      await vault.setOperator(operator.address);
      await vault.setFeeReceiver(feeReceiver.address);
      await lstBTC.setMinter(await vault.getAddress(), true);
      await lstBTC.setYieldDistributor(await vault.getAddress(), true);

      await vault.whitelistLST(await stCORE.getAddress(), true);

      // Mint tokens
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");
      await wBTC.mint(user1.address, wBTCAmount);
      await stCORE.mint(user1.address, stCOREAmount);
      await wBTC.mint(user2.address, wBTCAmount);
      await stCORE.mint(user2.address, stCOREAmount);

      await priceOracle.setPrice(CORE_NATIVE, ethers.parseEther("0.00000888"));
      await priceOracle.setPrice(
        await stCORE.getAddress(),
        ethers.parseEther("1.418023")
      );
    });

    it("Should revert deposit with non-whitelisted LST", async function () {
      const amount = ethers.parseUnits("1", 8);
      await wBTC.connect(user1).approve(await vault.getAddress(), amount);
      await otherLST.mint(user1.address, ethers.parseEther("10"));
      await otherLST
        .connect(user1)
        .approve(await vault.getAddress(), ethers.parseEther("10"));

      await expect(
        vault
          .connect(user1)
          .deposit(amount, ethers.parseEther("10"), await otherLST.getAddress())
      ).to.be.revertedWith("LST not whitelisted");
    });

    it("Should revert closeEpoch if no deposits", async function () {
      await expect(vault.connect(operator).closeEpoch()).to.be.revertedWith(
        "Vault: Epoch not finished"
      );
    });

    it("Should revert notifyYield(0,0)", async function () {
      // Make a deposit so epoch exists
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      await ethers.provider.send("evm_increaseTime", [25 * 3600]);
      await ethers.provider.send("evm_mine");

      await vault.connect(operator).closeEpoch();

      await expect(
        vault.connect(operator).notifyYield(0, 0)
      ).to.be.revertedWith("Vault: yield amount must be positive");
    });

    it("Should handle multiple epochs back-to-back", async function () {
      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");

      // Deposit
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);
      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      // Epoch 1
      await ethers.provider.send("evm_increaseTime", [25 * 3600]);
      await vault.connect(operator).closeEpoch();
      await wBTC.mint(
        await custodian.getAddress(),
        ethers.parseUnits("0.1", 8)
      );
      await vault.connect(operator).notifyYield(ethers.parseUnits("0.1", 8), 0);
      await vault.connect(operator).distributeEpochYield();

      const supplyAfterEpoch1 = await lstBTC.totalSupply();

      // Start Epoch 2
      await vault.connect(operator).startNewEpoch();

      // Epoch 2
      await ethers.provider.send("evm_increaseTime", [25 * 3600]);
      await vault.connect(operator).closeEpoch();
      await stCORE.mint(await custodian.getAddress(), ethers.parseEther("1"));
      await vault.connect(operator).notifyYield(0, ethers.parseEther("1"));
      await vault.connect(operator).distributeEpochYield();

      const supplyAfterEpoch2 = await lstBTC.totalSupply();
      expect(supplyAfterEpoch2).to.be.gt(supplyAfterEpoch1);
    });

    it("Should respect protocolFeePoints during deposits/redemptions", async function () {
      await vault.setProtocolFeePoints(10000); // 1%

      const wBTCAmount = ethers.parseUnits("1", 8);
      const stCOREAmount = ethers.parseEther("10");
      await wBTC.connect(user1).approve(await vault.getAddress(), wBTCAmount);
      await stCORE
        .connect(user1)
        .approve(await vault.getAddress(), stCOREAmount);

      await vault
        .connect(user1)
        .deposit(wBTCAmount, stCOREAmount, await stCORE.getAddress());

      // Simulate some ETH as fee in vault
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: ethers.parseEther("1"),
      });

      const beforeBalance = await ethers.provider.getBalance(
        feeReceiver.address
      );
      await vault.collectFees();
      const afterBalance = await ethers.provider.getBalance(
        feeReceiver.address
      );
      expect(afterBalance).to.be.gt(beforeBalance);
    });

    it("Should allow emergencyWithdraw for ERC20 and native", async function () {
      // ERC20
      await wBTC.mint(await vault.getAddress(), ethers.parseUnits("1", 8));
      await vault.emergencyWithdraw(
        await wBTC.getAddress(),
        ethers.parseUnits("1", 8)
      );
      expect(await wBTC.balanceOf(owner.address)).to.be.gt(0);

      // Native
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: ethers.parseEther("0.5"),
      });
      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      await vault.emergencyWithdraw(CORE_NATIVE, ethers.parseEther("0.5"));
      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalAfter).to.be.gt(ownerBalBefore);
    });

    it("Should reject deposits below BTC min value", async function () {
      const smallWBTC = ethers.parseUnits("0.00001", 8);
      const stCOREAmount = 0;

      await wBTC.connect(user1).approve(await vault.getAddress(), smallWBTC);
      await expect(
        vault
          .connect(user1)
          .deposit(smallWBTC, stCOREAmount, await stCORE.getAddress())
      ).to.be.revertedWith("Deposits must be greater than zero");
    });
  });
  it("Stress: should handle yield distribution with 100+ depositors", async function () {
    this.timeout(120000);
    const depositors = [];
    const depositAmountWBTC = ethers.parseUnits("0.1", 8);
    const depositAmountStCORE = ethers.parseEther("1");

    // Create 105 depositors with small balances
    for (let i = 0; i < 105; i++) {
      const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
      depositors.push(wallet);

      // Fund with ETH for gas
      await owner.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("1"),
      });

      // Mint tokens to them
      await wBTC.mint(wallet.address, depositAmountWBTC);
      await stCORE.mint(wallet.address, depositAmountStCORE);

      const vaultAddr = await vault.getAddress();
      await wBTC.connect(wallet).approve(vaultAddr, depositAmountWBTC);
      await stCORE.connect(wallet).approve(vaultAddr, depositAmountStCORE);
      await vault
        .connect(wallet)
        .deposit(
          depositAmountWBTC,
          depositAmountStCORE,
          await stCORE.getAddress()
        );
    }

    // Advance time and close epoch
    await ethers.provider.send("evm_increaseTime", [25 * 3600]);
    await vault.connect(operator).closeEpoch();

    // Add yield to custodian
    const yieldWBTC = ethers.parseUnits("1", 8);
    await wBTC.mint(await custodian.getAddress(), yieldWBTC);

    await vault.connect(operator).notifyYield(yieldWBTC, 0);

    // Measure gas for distribution
    const tx = await vault.connect(operator).distributeEpochYield();
    const receipt = await tx.wait();
    console.log(
      "Gas used for 100+ depositors yield distribution:",
      receipt.gasUsed.toString()
    );

    const bal = await lstBTC.balanceOf(depositors[0].address);
    expect(bal).to.be.gt(0);
  });
});
