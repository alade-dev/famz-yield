---
title: FAQ
---

# Frequently Asked Questions

## Q: What is lstBTC?

A: `lstBTC` is a yield-bearing ERC-20 token where 1 lstBTC = 1 BTC in value. It represents a claim on a basket of wBTC and stCORE held in the vault, plus any yield earned.

## Q: How does the epoch system work?

A: The vault operates in **24-hour epochs**.

- If you deposit during an epoch, your deposit starts earning yield in the **next epoch**.
- If you request a withdrawal, your assets are returned at the **end of the current epoch**.  
  This batching makes yield calculations simpler and ensures fairness.

## Q: How is yield distributed?

A: Yields are tracked separately for **wBTC** and **stCORE**:

1. The operator closes the epoch to lock participant balances.
2. The operator injects yield into the `Custodian` (in wBTC and/or stCORE).
3. The vault converts yields to a BTC-equivalent value and mints new `lstBTC` proportionally to each participant’s BTC-equivalent share.

## Q: Can I redeem anytime?

A: You can request redemption at any time, but assets are released **at the end of the epoch** to ensure correct yield accounting.

## Q: Can I lose money?

A: On **testnet** — no (funds are simulated).  
On **mainnet** — yes, due to potential smart contract bugs, strategy underperformance, or oracle failures.

## Q: Why track yields separately for wBTC and stCORE?

A: wBTC and stCORE have different yield sources and risk profiles. Tracking them separately ensures:

- Accurate BTC-equivalent valuation.
- Fair yield distribution based on the type and value of assets deposited.

## Q: Who can trigger yield distribution?

A: Only the designated **operator** can:

- Close epochs.
- Inject yields.
- Distribute yields to participants.
