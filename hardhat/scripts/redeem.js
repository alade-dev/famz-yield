const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const vaultAddress = "YOUR_VAULT_ADDRESS";
  const vault = await hre.ethers.getContractAt(
    "LstBTCVault",
    vaultAddress,
    signer
  );

  const balance = await vault.balanceOf(signer.address);
  const tx = await vault.redeem(balance);
  await tx.wait();

  console.log("Redeemed lstBTC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
