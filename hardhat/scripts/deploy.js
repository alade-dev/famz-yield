const hre = require("hardhat");

async function main() {
  const [deployer, user] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ST_CORE = "0x6401f24ef7c54032f4f54e67492928973ab87650"; //ST_CORE Testnet Address
  const earn = "0x88604930edcf91c69e5a552aa9e111149cf7b374"; // EarnTestnet Address

  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = await MockWBTC.deploy();
  await wbtc.waitForDeployment();

  // Deploy lstBTC
  const LstBTC = await hre.ethers.getContractFactory("lstBTC");
  const lstBTC = await LstBTC.deploy(deployer.address);
  await lstBTC.waitForDeployment();
  const lstBTCAddress = await lstBTC.getAddress();
  console.log("lstBTC deployed to:", lstBTCAddress);

  const MockCustodianAdapter = await ethers.getContractFactory(
    "MockCustodianAdapter"
  );
  const adapter = await MockCustodianAdapter.deploy(owner.address);
  await adapter.waitForDeployment();

  // Deploy Vault
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    lstBTC.target,
    adapter.target,
    wbtc.target,
    earn,
    deployer.address
  );
  await vault.waitForDeployment();

  // Transfer LstBTC ownership to Vault
  await lstBTC.connect(deployer).transferOwnership(vault.target);

  // Set Vault in Adapter
  await adapter.connect(deployer).setVault(vault.target);

  // Whitelist ST_CORE and set price
  await adapter.connect(deployer).addKnownLST(ST_CORE);
  await adapter
    .connect(deployer)
    .setLSTPriceInCORE(ST_CORE, ethers.parseUnits("1.41", 18)); // 1 ST_CORE = 1.41 CORE

  // Set Vault admin roles
  await vault.connect(deployer).setOperator(deployer.address);
  await vault.connect(deployer).setFeeReceiver(feeReceiver.address);
  await vault.connect(deployer).whitelistLST(ST_CORE, true);

  // 11. Set correct oracle prices
  await vault.connect(deployer).updateOraclePrices(
    ethers.parseUnits("114000", 8), // WBTC = $117k
    ethers.parseUnits("0.50", 8) // CORE = $0.5 (correct price)
  );

  console.log("✅ All contracts deployed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
