---
title: Understanding Yield
---

# How Yield Works

Yield is generated from:
- **wBTC**: Lending or yield strategies (simulated on testnet)
- **stCORE**: Staking rewards from the Earn protocol

The **operator** periodically:
1. Collects earned yield
2. Transfers it to the vault
3. Calls `notifyYield(amount)`
4. New `lstBTC` is minted and distributed to holders

Users see their `lstBTC` balance increase over time.