const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const vaultAddress = "YOUR_VAULT_ADDRESS";
  const vault = await hre.ethers.getContractAt(
    "LstBTCVault",
    vaultAddress,
    signer
  );

  const wbtcAmount = hre.ethers.parseUnits("1", 8); // 1 wBTC
  const stCoreAmount = hre.ethers.parseUnits("1000", 18); // 1000 stCORE

  const tx = await vault.deposit(wbtcAmount, stCoreAmount);
  await tx.wait();

  console.log("Deposited 1 wBTC + 1000 stCORE");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
