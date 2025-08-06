const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();

  const wBTC = await ethers.getContractAt("MockWBTC", "WBTC_ADDRESS");
  const vaultNew = await ethers.getContractAt("VaultNew", VAULT_ADDRESS);

  const totalSupply = await wBTC.balanceOf(owner.address);
  console.log("Owner wBTC balance:", ethers.formatUnits(totalSupply, 18));

  // Simulate 0.01 WBTC yield per week (for testing)
  const weeklyYield = ethers.parseUnits("0.01", 18);

  // Send yield to Vault
  await wBTC.transfer(vaultNew.target, weeklyYield);
  console.log("Injected 0.01 WBTC yield to Vault");

  // Notify vault to distribute lstBTC
  await vaultNew.notifyYield(weeklyYield);
  console.log("Distributed lstBTC yield to users");
}

main().catch(console.error);
