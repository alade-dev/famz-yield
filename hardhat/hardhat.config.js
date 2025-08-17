require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");

const COMPILER_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 1000000,
  },
  metadata: {
    bytecodeHash: "none",
  },
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: COMPILER_SETTINGS,
      },
      {
        version: "0.8.20",
        settings: COMPILER_SETTINGS,
      },
      {
        version: "0.8.7",
        settings: COMPILER_SETTINGS,
      },
      {
        version: "0.8.6",
        settings: COMPILER_SETTINGS,
      },
      {
        version: "0.8.0",
        settings: COMPILER_SETTINGS,
      },
    ],
  },
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [""],
    },
    coretestnet: {
      url: process.env.CORE_TESTNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [""],
      chainId: 1114,
    },
    coremainnet: {
      url: process.env.CORE_MAINNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [""],
      chainId: 1116,
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.HOLESKY_ETHERSCAN_KEY,
      coretestnet: process.env.CORE_SCAN_API_KEY,
    },
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io",
        },
      },
      {
        network: "coretestnet",
        chainId: 1114,
        urls: {
          apiURL: "https://api.test2.btcs.network/api",
          browserURL: "https://scan.test2.btcs.network/",
        },
      },
      {
        network: "coremainnet",
        chainId: 1116,
        urls: {
          apiURL: "https://api.btcs.network/api",
          browserURL: "https://scan.btcs.network/",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
