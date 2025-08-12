# Faucet Implementation Guide

## Overview

The faucet page now includes comprehensive token minting functionality for both wBTC and stCORE tokens on Core Testnet. Each wallet can mint tokens once every 24 hours with client-side rate limiting.

## ✅ Production Ready Mode

**CURRENT STATUS:**

- ✅ **Rate limiting is ACTIVE** - Users can mint wBTC once every 24 hours
- ✅ **wBTC minting via smart contract** - Direct minting to wallet with rate limiting
- ✅ **stCORE minting via external link** - Links to official Core staking platform
- ✅ **Time tracking is enabled** - 24-hour cooldown periods enforced
- ✅ **Transaction cancellation handling** - Button resets to original state if user cancels transaction

The faucet is now ready for production use with proper rate limiting.

## Transaction States & Button Behavior

### Button States:

1. **Default**: "Mint wBTC (0.05)" - Ready to mint
2. **Loading**: "Minting..." with spinner - Transaction being processed
3. **Cancelled**: Returns to default state - User cancelled transaction
4. **Success**: Shows success message - Transaction confirmed

### Transaction Cancellation:

- If user **cancels transaction** in wallet, button immediately returns to default state
- Shows "Transaction Cancelled" toast notification (non-error style)
- No loading state persists after cancellation
- **No rate limiting applied** - User can immediately try minting again
- Rate limiting only applies after successful transaction confirmation

## Features Implemented

### ✅ Completed Features

1. **wBTC Minting**

   - Mint 0.05 wBTC per wallet per 24 hours
   - Connected to deployed MockWBTC contract: `0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa`

2. **Rate Limiting System**

   - 24-hour cooldown per wallet address per token type
   - Uses localStorage for client-side tracking
   - Displays countdown timer when rate limited

3. **User Experience**

   - Loading states during transactions
   - Success/error feedback with toast notifications
   - Visual countdown timers
   - Wallet connection requirements
   - Network validation (Core Testnet only)

4. **Smart Contract Integration**
   - Uses wagmi v2 for Web3 interactions
   - Proper error handling and transaction waiting
   - Core Testnet (Chain ID: 1114) configuration

## Contract Addresses

```typescript
const CONTRACT_ADDRESSES = {
  1114: {
    // Core Testnet
    WBTC: "0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa",
    VAULT: "0x6924a3828952867F713D25a949D34B81c9836653",
    LST_BTC: "0xf47c98abA1a4c4eB778991AeE7Ea889a977fEA3E",
    ST_CORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650",
    CUSTODIAN: "0x507b00ad0e362C9C6Bc6Fe044F3c062f15C2FC5A",
    PRICE_ORACLE: "0x0e3EB58b29CB991F9DFf00318b6449021A7cd943",
  },
};
```

## File Structure

### New Files Created

1. **`client/src/config/contracts.ts`**

   - Contract addresses and ABIs
   - Testnet configuration
   - Default mint amounts

2. **`client/src/hooks/useWBTCMint.ts`**

   - wBTC minting functionality
   - Rate limiting logic
   - Transaction handling

3. **`client/src/hooks/useStCOREMint.ts`**

   - stCORE minting functionality
   - Rate limiting logic
   - Transaction handling

4. **`client/src/hooks/useFaucet.ts`**
   - Unified faucet interface
   - Service management
   - Combines all token minting services

### Modified Files

1. **`client/src/config/wagmi.ts`**

   - Added Core Testnet configuration
   - Chain ID 1114 with proper RPC and explorer URLs

2. **`client/src/pages/Faucet.tsx`**
   - Updated UI to include mint buttons
   - Dynamic service rendering
   - Status messages and feedback

## Usage Instructions

### For Users

1. **Connect Wallet**: Users must connect their wallet to MetaMask or other supported wallets
2. **Switch Network**: Ensure wallet is connected to Core Testnet (Chain ID: 1114)
3. **Mint Tokens**: Click the respective mint buttons for wBTC or stCORE
4. **Wait for Confirmation**: Transaction will be submitted and users wait for blockchain confirmation
5. **24-Hour Cooldown**: After successful minting, users must wait 24 hours before minting again

### For Developers

#### Adding New Token Services

1. Create a new hook following the pattern in `useWBTCMint.ts`:

```typescript
export const useNewTokenMint = () => {
  // Rate limiting logic
  // Contract interaction
  // Error handling
  return { mint, isLoading, canMint, ... }
}
```

2. Add the service to `useFaucet.ts`:

```typescript
const services: FaucetService[] = [
  // existing services...
  {
    name: "New Token",
    symbol: "NEW",
    amount: "10.0",
    description: "Description",
    mint: newTokenMint.mint,
    // ... other properties
  },
];
```

3. Add contract address to `contracts.ts`

#### Rate Limiting Customization

Rate limiting can be customized by modifying the `twentyFourHours` constant in the mint hooks:

```typescript
const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours
const oneHour = 60 * 60 * 1000; // 1 hour
const tenMinutes = 10 * 60 * 1000; // 10 minutes
```

## Security Considerations

### Rate Limiting

- **Client-Side Only**: Current implementation uses localStorage for rate limiting
- **Not Foolproof**: Users can clear localStorage or use different browsers/devices
- **IP Tracking**: Not implemented due to VPN/proxy limitations
- **Smart Contract Enforcement**: For production, consider implementing rate limiting in smart contracts

### Recommendations for Production

1. **Smart Contract Rate Limiting**: Implement cooldown periods in the smart contracts themselves
2. **Server-Side Validation**: Add backend validation with database tracking
3. **Captcha Integration**: Add human verification to prevent automated abuse
4. **Gas Optimization**: Consider batch minting or more efficient contract designs

## Testing

### Manual Testing Steps

1. Connect wallet to Core Testnet
2. Try minting wBTC - should succeed
3. Try minting wBTC again immediately - should show cooldown timer
4. Try minting stCORE - should succeed (independent cooldown)
5. Wait for cooldown or clear localStorage to test again
6. Test with disconnected wallet - should show connection prompt
7. Test on wrong network - should show network error

### Error Scenarios Covered

- Wallet not connected
- Wrong network
- Rate limiting active
- Transaction failures
- Contract not available
- Insufficient gas

## Future Enhancements

### Potential Improvements

1. **Multi-Network Support**: Add support for other testnets
2. **Batch Minting**: Allow minting multiple tokens in one transaction
3. **Referral System**: Reward users for referring others
4. **Analytics Dashboard**: Track minting statistics
5. **Social Login**: Allow minting with social accounts
6. **NFT Rewards**: Give special NFTs to active testnet users

### Smart Contract Enhancements

1. **Built-in Rate Limiting**: Move cooldown logic to smart contracts
2. **Merkle Tree Allowlists**: Implement whitelist-based minting
3. **Dynamic Amounts**: Allow varying mint amounts based on demand
4. **Multi-Token Faucet**: Single contract handling multiple token types

## Troubleshooting

### Common Issues

1. **"Contract Not Available" Error**

- Ensure wallet is connected to Core Testnet (Chain ID: 1114)
- Check if contract addresses are correct

2. **Rate Limit Issues**

   - Clear browser localStorage to reset cooldowns
   - Check browser console for detailed error messages

3. **Transaction Failures**

   - Ensure wallet has sufficient CORE for gas fees
   - Check Core Testnet status and RPC connectivity

4. **UI Not Updating**
   - Refresh page after wallet connection
   - Check browser console for React/JavaScript errors

### Development Issues

1. **TypeScript Errors**

   - Ensure all contract ABIs are properly typed
   - Check wagmi hook usage and parameters

2. **Build Errors**
   - Verify all imports are correct
   - Check for missing dependencies

## Support

For issues or questions:

1. Check browser console for detailed error messages
2. Verify Core Testnet connectivity
3. Ensure wallet has testnet CORE for gas fees
4. Contact development team with specific error details
