---
title: Redeeming Assets
---

# How to Redeem

1. Connect your wallet.
2. Call `VaultNew.redeem(lstBTCAmount)`.
3. Burn your `lstBTC`.
4. Receive `wBTC` and `stCORE` back in your original deposit ratio.

### Example (JavaScript)

```js
const tx = await vault.redeem(ethers.utils.parseUnits("0.5", 18));
await tx.wait();
console.log("Redemption successful!");
```
