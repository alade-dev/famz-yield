---
title: Setup & Deployment
---

# Developer Setup

Follow these steps to set up and test the **Famz Vault** smart contract system.

## 1. Clone the Repository

```bash
git clone https://github.com/alade-dev/famz-yield.git
cd famz-yield
```

## 2. Install Dependencies

```bash
npm install
```

This will install Hardhat, Ethers.js, Chai, and other required dev dependencies.

## 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Example:

```env
# Private keys for deployment accounts
DEPLOYER_PRIVATE_KEY=0xabc123...
OPERATOR_PRIVATE_KEY=0xdef456...

# RPC URLs
CORE_TESTNET_RPC_URL=https://rpc.test2.btcs.network/

# Corescan API key for contract verification
CORE_SCAN_API_KEY=your_key_here
```

## 4. Compile Contracts

```bash
npx hardhat compile
```

This will generate the ABI and bytecode for all contracts in `artifacts/`.

## 5. Run Tests

```bash
npx hardhat test
```

You should see all test cases passing.
Tests cover deposits, redemptions, epoch yield distribution, admin functions, and view functions.

## 6. Local Development with Hardhat Node

Run a local Hardhat blockchain:

```bash
npx hardhat node
```

In another terminal, deploy contracts locally:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

## 7. Deployment to Testnet/Mainnet

Example for Core Testnet:

```bash
npx hardhat run scripts/deploy.js --network coreTestnet
```

Example for Core Mainnet:

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## 8. Verify Contracts on Etherscan

```bash
npx hardhat verify --network coreTestnet <DEPLOYED_CONTRACT_ADDRESS> "constructor_arg1" "constructor_arg2"
```

## 9. Project Structure

```
famz-yield/
│
├── contracts/        # Solidity smart contracts
├── scripts/          # Deployment & utility scripts
├── test/             # Hardhat test files
├── .env.example      # Sample environment configuration
├── hardhat.config.js # Hardhat configuration file
└── package.json
```

---

**Note:**

- Ensure your `DEPLOYER_PRIVATE_KEY` has enough ETH for deployment gas.
- For production deployments, run audits and security checks before going live.
- You can integrate CI/CD pipelines to run tests automatically on every commit.
