---
title: Depositing Assets
---

# How to Deposit

1. Connect your wallet (MetaMask, WalletConnect).
2. Approve `wBTC` and `stCORE` for spending.
3. Call `VaultNew.deposit(wBTCAmount, stCOREAmount)`.
4. Receive `lstBTC` tokens 1:1 with BTC value.

### Example (Ethers.js - JavaScript)

```js
const { ethers } = require("ethers");

// Assuming you have a provider and signer set up
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Connect to the Vault contract
const vault = new ethers.Contract("VAULT_ADDRESS", vaultABI, signer);

// Deposit 0.1 wBTC and 1000 stCORE
const tx = await vault.deposit(
  ethers.utils.parseUnits("0.1", 8), // 0.1 wBTC (8 decimals)
  ethers.utils.parseUnits("1000", 18) // 1000 stCORE (18 decimals)
);

await tx.wait();
console.log("Deposit successful!");
```
