---
title: Redeeming Assets
---

# How to Redeem

The **Vault** contract allows you to redeem `lstBTC` for the underlying assets:

- **wBTC** (Wrapped Bitcoin)
- **stCORE** (or other supported LSTs)

Redemptions are **BTC value–based** and proportional to your original deposit ratio.

⚡ **Key Points**:

- Redemptions are **queued until the current epoch ends** (24-hour cycles).
- You can redeem **any amount above the minimum**.
- Assets are withdrawn from `Custodian.sol` and sent directly to your wallet.

---

## Steps to Redeem

1. **Connect your wallet** (MetaMask, WalletConnect).
2. Call:

```solidity
Vault.redeem(uint256 lstBTCAmount, address lstToken)
```

- `lstBTCAmount` → amount of lstBTC to redeem.
- `lstToken` → the LST you want to receive alongside your wBTC (e.g., stCORE address).

3. **Wait for epoch completion** — your redemption will be processed at the end of the current 24-hour cycle.
4. Receive wBTC and/or stCORE in your wallet.

---

## Example (Ethers.js - JavaScript)

```js
import { ethers } from "ethers";

// Provider + Signer setup (MetaMask)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Connect to the Vault contract
const vault = new ethers.Contract("VAULT_ADDRESS", vaultABI, signer);

// Redeem 0.5 lstBTC for wBTC + stCORE
const STCORE_ADDRESS = "0x...";
const tx = await vault.redeem(
  ethers.utils.parseEther("0.5"), // 0.5 lstBTC
  STCORE_ADDRESS // LST token to receive
);

await tx.wait();
console.log("✅ Redemption queued — will be processed at end of epoch.");
```

---

## Behind the Scenes

- **Step 1**: Vault verifies you have enough `lstBTC`.
- **Step 2**: Redemption is locked until the current epoch closes.
- **Step 3**: At epoch close, Vault:

  - Burns your `lstBTC`.
  - Requests assets from `Custodian.sol` based on your deposit ratio.
  - Sends wBTC and LSTs to your wallet.

- **Step 4**: You can deposit again anytime.

---

> ⚠️ **Reminder**: On testnet only — mainnet deployment will follow after a full audit.
