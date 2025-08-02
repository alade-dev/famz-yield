// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LstBTC
 * @author Liquid Staking Team
 * @notice A yield-bearing ERC20 token representing liquid staked Bitcoin (BTC)
 * @dev 1 lstBTC is pegged to 1 BTC, with the exchange rate increasing over time as yield accrues
 *      Only the Vault contract is authorized to mint, burn, and update the exchange rate
 *      Uses 1e18 precision for BTC value calculations
 */
contract LstBTC is ERC20, Ownable {
    /// @notice Base unit for rate calculations (1e18)
    uint256 private constant RATE_BASE = 1e18;

    /**
     * @notice The current exchange rate: 1 lstBTC = exchangeRate / 1e18 BTC
     * @dev Increases as yield is realized and BTC backing grows
     *      Example: If exchangeRate = 1.05e18, then 1 lstBTC = 1.05 BTC
     */
    uint256 public exchangeRate; // 1e18 base, where 1 lstBTC = 1 BTC

    /**
     * @notice Constructs the LstBTC token
     * @param initial_owner The initial owner of the contract (typically the Vault)
     */
    constructor(address initial_owner)
        Ownable(initial_owner)
        ERC20("Liquid Staked BTC", "lstBTC")
    {
        exchangeRate = RATE_BASE; // Initial rate: 1 lstBTC = 1 BTC
    }

    /**
     * @notice Mints lstBTC to a user based on deposited BTC value
     * @dev Only callable by the owner (Vault)
     *      The amount of lstBTC minted is calculated as:
     *      `amountBTC * RATE_BASE / exchangeRate`
     *      This ensures users receive tokens based on current exchange rate
     * @param to The address to mint lstBTC to
     * @param amountBTC The amount of BTC (in 1e18 units) being deposited
     */
    function mintAtValue(address to, uint256 amountBTC) external onlyOwner {
        uint256 amount = (amountBTC * RATE_BASE) / exchangeRate;
        _mint(to, amount);
    }

    /**
     * @notice Burns lstBTC from a user during redemption
     * @dev Only callable by the owner (Vault)
     * @param from The address to burn lstBTC from
     * @param amount The amount of lstBTC to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @notice Updates the exchange rate to reflect accrued yield
     * @dev Only callable by the owner (Vault)
     *      The exchange rate determines how much BTC each lstBTC is worth
     *      Must be greater than zero
     * @param newRate The new exchange rate (1e18 base), where 1 lstBTC = newRate / 1e18 BTC
     */
    function updateExchangeRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be > 0");
        exchangeRate = newRate;
    }

    /**
     * @notice Calculates the total BTC backing of all outstanding lstBTC
     * @dev Returns the sum of BTC value represented by all tokens in circulation
     *      Calculated as: `(totalSupply * exchangeRate) / RATE_BASE`
     * @return The total BTC value (in 1e18 units) backing all lstBTC
     */
    function totalValue() external view returns (uint256) {
        return (totalSupply() * exchangeRate) / RATE_BASE;
    }
}