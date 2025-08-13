---
title: Depositing Assets
---

# How to Deposit

The **VaultNew** contract accepts **wBTC** and **Liquid Staking Tokens (LSTs)** such as `stCORE` in a **single transaction**.  
Deposits are converted into **lstBTC** based on their BTC-equivalent value using Chainlink price feeds via `PriceOracle.sol`.

⚡ **Key Points**:

- You can deposit only **wBTC**, **stCORE**.
- Deposits start earning yield **from the next epoch** (24-hour cycles).
- All deposits are sent to `Custodian.sol` for safekeeping.

---

## Steps to Deposit

1. **Connect your wallet** (MetaMask, WalletConnect).
2. **Approve** `wBTC` and/or `stCORE` for spending by the Vault contract.
3. Call:

```solidity
VaultNew.deposit(uint256 amountWBTC, uint256 amountLST, address lstToken)
```

````

- `amountWBTC` → amount of wBTC (8 decimals).
- `amountLST` → amount of stCORE or another whitelisted LST (18 decimals).
- `lstToken` → address of the LST (e.g., stCORE token address).

4. **Receive** `lstBTC` in your wallet, proportional to the BTC value deposited.

---

## Example (Ethers.js - JavaScript)

```js
import { ethers } from "ethers";

// Provider + Signer setup (MetaMask)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Connect to the Vault contract
const vault = new ethers.Contract("VAULT_ADDRESS", vaultABI, signer);

// Token addresses
const WBTC_ADDRESS = "0x...";
const STCORE_ADDRESS = "0x...";

// Approve Vault to spend tokens
const wbtc = new ethers.Contract(WBTC_ADDRESS, erc20ABI, signer);
await wbtc.approve(vault.address, ethers.utils.parseUnits("0.1", 8));

const stcore = new ethers.Contract(STCORE_ADDRESS, erc20ABI, signer);
await stcore.approve(vault.address, ethers.utils.parseUnits("1000", 18));

// Deposit both wBTC and stCORE
const tx = await vault.deposit(
  ethers.utils.parseUnits("0.1", 8), // 0.1 wBTC
  ethers.utils.parseUnits("1000", 18), // 1000 stCORE
  STCORE_ADDRESS // LST token address
);

await tx.wait();
console.log("✅ Deposit successful! lstBTC credited.");
```

---

## Behind the Scenes

- **Step 1**: Vault verifies LST token is whitelisted.
- **Step 2**: BTC-equivalent value is calculated using `PriceOracle.sol`.
- **Step 3**: Tokens are transferred to `Custodian.sol`.
- **Step 4**: Vault mints equivalent `lstBTC` to your wallet.
- **Step 5**: Yield starts accruing from the **next epoch**.

---

> ⚠️ **Reminder**: On testnet only — mainnet deployment will follow after a full audit.
````
