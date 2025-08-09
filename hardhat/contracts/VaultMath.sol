// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title lstBTC Vault Math Library
/// @notice Pure math logic for minting and redeeming lstBTC using wBTC and stCORE
library VaultMath {
    uint256 public constant SCALE = 1e18;

    /// @notice Calculate BTC-equivalent value of stCORE
    /// @param amountOfStCORE Amount of stCORE tokens (token units)
    /// @param priceStCORE_CORE stCORE to CORE price (1e18-scaled)
    /// @param priceCORE_BTC CORE to BTC price (1e18-scaled)
    /// @return BTC value of stCORE
    function btcValueOfStCORE(
        uint256 amountOfStCORE,
        uint256 priceStCORE_CORE,
        uint256 priceCORE_BTC
    ) internal pure returns (uint256) {
        // (amountOfStCORE × priceStCORE_CORE × priceCORE_BTC) ÷ (SCALE²)
        return (amountOfStCORE * priceStCORE_CORE * priceCORE_BTC) / (SCALE * SCALE);
    }

    /// @notice Calculate how much lstBTC to mint
    /// @param amountOfwBTC Amount of wBTC (8 decimals - native wBTC scale)
    /// @param amountOfStCORE Amount of stCORE (token units)
    /// @param priceStCORE_CORE stCORE to CORE price (1e18-scaled)
    /// @param priceCORE_BTC CORE to BTC price (1e18-scaled)
    /// @return Amount of lstBTC to mint (1e18-scaled)
    function calculateLstBTCToMint(
        uint256 amountOfwBTC,
        uint256 amountOfStCORE,
        uint256 priceStCORE_CORE,
        uint256 priceCORE_BTC
    ) internal pure returns (uint256) {
        // Convert wBTC from 8 decimals to 18 decimals for consistent calculation
        uint256 wBTCIn18Decimals = amountOfwBTC * 1e10;
        uint256 stCOREinBTC = btcValueOfStCORE(amountOfStCORE, priceStCORE_CORE, priceCORE_BTC);
        return wBTCIn18Decimals + stCOREinBTC;
    }

    /// @notice Calculate redemption amounts for wBTC and stCORE
    /// @param amountOfLstBTC Amount of lstBTC to redeem (1e18-scaled)
    /// @param r_wBTC User's wBTC deposit ratio (1e18-scaled)
    /// @param r_stCORE User's stCORE deposit ratio (1e18-scaled)
    /// @param priceStCORE_CORE stCORE to CORE price (1e18-scaled)
    /// @param priceCORE_BTC CORE to BTC price (1e18-scaled)
    /// @return wBTCReturned wBTC to return (8 decimals - native wBTC scale)
    /// @return stCOREReturned stCORE to return (token units)
    function calculateRedemption(
        uint256 amountOfLstBTC,
        uint256 r_wBTC,
        uint256 r_stCORE,
        uint256 priceStCORE_CORE,
        uint256 priceCORE_BTC
    ) internal pure returns (uint256 wBTCReturned, uint256 stCOREReturned) {
        // Calculate wBTC amount in 18 decimals, then convert back to 8 decimals
        uint256 wBTCIn18Decimals = (amountOfLstBTC * r_wBTC) / SCALE;
        wBTCReturned = wBTCIn18Decimals / 1e10; // Convert from 18 decimals to 8 decimals
        
        uint256 btcValueForStCORE = (amountOfLstBTC * r_stCORE) / SCALE;
        stCOREReturned = (btcValueForStCORE * SCALE * SCALE) / (priceStCORE_CORE * priceCORE_BTC);
    }

    /// @notice Calculate deposit ratios for a user
    /// @param amountOfwBTC Amount of wBTC deposited (8 decimals - native wBTC scale)
    /// @param amountOfStCORE Amount of stCORE deposited (token units)
    /// @param priceStCORE_CORE stCORE to CORE price (1e18-scaled)
    /// @param priceCORE_BTC CORE to BTC price (1e18-scaled)
    /// @return r_wBTC wBTC ratio (1e18-scaled)
    /// @return r_stCORE stCORE ratio (1e18-scaled)
    function calculateDepositRatios(
        uint256 amountOfwBTC,
        uint256 amountOfStCORE,
        uint256 priceStCORE_CORE,
        uint256 priceCORE_BTC
    ) internal pure returns (uint256 r_wBTC, uint256 r_stCORE) {
        // Convert wBTC to 18 decimals for consistent calculation
        uint256 wBTCIn18Decimals = amountOfwBTC * 1e10;
        uint256 stCOREinBTC = btcValueOfStCORE(amountOfStCORE, priceStCORE_CORE, priceCORE_BTC);
        uint256 totalBTCValue = wBTCIn18Decimals + stCOREinBTC;
        
        require(totalBTCValue > 0, "Total value must be greater than 0");
        
        r_wBTC = (wBTCIn18Decimals * SCALE) / totalBTCValue;
        r_stCORE = (stCOREinBTC * SCALE) / totalBTCValue;
    }
}
