const { exec } = require("child_process");
const { ethers } = require("ethers");

async function stakeBTC(amount) {
  // Call Core DAO CLI or custodian
  exec(`python3 btc_stake.py ${amount}`, (err, stdout, stderr) => {
    if (err) {
      console.error("BTC Staking failed:", stderr);
      return;
    }
    console.log("BTC Staked:", stdout);
  });
}

async function stakeCORE(amount, validator) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const DualStakingManager = new ethers.Contract(
    process.env.DUAL_STAKING_MANAGER,
    process.env.DUAL_STAKING_MANAGER_ABI,
    wallet
  );

  const tx = await DualStakingManager.depositCORE(amount, validator);
  await tx.wait();
  console.log("CORE Staked:", tx.hash);
}

async function claimRewardsAndUpdateRate() {
  const DualStakingManager = new ethers.Contract(
    process.env.DUAL_STAKING_MANAGER,
    process.env.DUAL_STAKING_MANAGER_ABI,
    wallet
  );

  const reward = await DualStakingManager.claimRewards();
  const lstBTC = new ethers.Contract(
    process.env.LSTBTC_ADDRESS,
    process.env.LSTBTC_ABI,
    wallet
  );

  const currentRate = await lstBTC.exchangeRate();
  const newRate = (currentRate * 105n) / 100n; // 5% daily for testing

  const tx = await lstBTC.rebase(newRate);
  await tx.wait();
  console.log("lstBTC exchange rate updated:", newRate.toString());
}

setInterval(claimRewardsAndUpdateRate, 86400 * 1000);
