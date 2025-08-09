// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LstBTC
 * @author Team
 * @notice A yield-bearing ERC20 token representing liquid staked Bitcoin (BTC)
 * @dev 1 lstBTC is always equal to 1 BTC. Yield is distributed by increasing user balances
 *      Only authorized contracts (Vault and Custodian) can mint and distribute yield
 *      Uses balance increasing method for yield distribution
 */
contract LstBTC is ERC20, Ownable {
    
    /// @notice Mapping to track authorized minters (Vault contract)
    mapping(address => bool) public authorizedMinters;
    
    /// @notice Mapping to track yield distributors
    mapping(address => bool) public yieldDistributors;

    /// @notice Event emitted when yield is distributed
    event YieldDistributed(address indexed recipient, uint256 amount);
    
    /// @notice Event emitted when a minter is authorized/deauthorized
    event MinterUpdated(address indexed minter, bool authorized);
    
    /// @notice Event emitted when a yield distributor is authorized/deauthorized
    event YieldDistributorUpdated(address indexed distributor, bool authorized);

    /**
     * @notice Constructs the LstBTC token
     * @param initialOwner The initial owner of the contract
     */
    constructor(address initialOwner)
        Ownable(initialOwner)
        ERC20("Liquid Staked BTC", "lstBTC")
    {
        // Owner starts as authorized minter and yield distributor
        authorizedMinters[initialOwner] = true;
        yieldDistributors[initialOwner] = true;
    }

    /**
     * @notice Modifier to check if caller is authorized minter
     */
    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _;
    }

    /**
     * @notice Modifier to check if caller is authorized yield distributor
     */
    modifier onlyYieldDistributor() {
        require(yieldDistributors[msg.sender], "Not authorized yield distributor");
        _;
    }

    /**
     * @notice Mints lstBTC tokens 1:1 with BTC value
     * @dev Only callable by authorized minters (Vault contract)
     * @param to The address to mint lstBTC to
     * @param amount The amount of lstBTC to mint (1e18 units, 1:1 with BTC)
     */
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /**
     * @notice Burns lstBTC from a user during redemption
     * @dev Only callable by authorized minters (Vault contract)
     * @param from The address to burn lstBTC from
     * @param amount The amount of lstBTC to burn
     */
    function burn(address from, uint256 amount) external onlyMinter {
        _burn(from, amount);
    }

    /**
     * @notice Distributes yield by increasing user balances
     * @dev Only callable by authorized yield distributors
     * @param recipients Array of addresses to receive yield
     * @param amounts Array of yield amounts corresponding to each recipient
     */
    function distributeYield(address[] calldata recipients, uint256[] calldata amounts) external onlyYieldDistributor {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                _mint(recipients[i], amounts[i]);
                emit YieldDistributed(recipients[i], amounts[i]);
            }
        }
    }

    /**
     * @notice Distributes yield to a single recipient
     * @dev Only callable by authorized yield distributors
     * @param recipient Address to receive yield
     * @param amount Amount of yield to distribute
     */
    function distributeYieldToUser(address recipient, uint256 amount) external onlyYieldDistributor {
        require(amount > 0, "Amount must be greater than 0");
        _mint(recipient, amount);
        emit YieldDistributed(recipient, amount);
    }

    /**
     * @notice Authorizes or deauthorizes a minter
     * @dev Only callable by owner
     * @param minter Address to update
     * @param authorized Whether to authorize or deauthorize
     */
    function setMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Zero address");
        authorizedMinters[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }

    /**
     * @notice Authorizes or deauthorizes a yield distributor
     * @dev Only callable by owner
     * @param distributor Address to update
     * @param authorized Whether to authorize or deauthorize
     */
    function setYieldDistributor(address distributor, bool authorized) external onlyOwner {
        require(distributor != address(0), "Zero address");
        yieldDistributors[distributor] = authorized;
        emit YieldDistributorUpdated(distributor, authorized);
    }

    /**
     * @notice Returns the total BTC value represented by all lstBTC tokens
     * @dev Since 1 lstBTC = 1 BTC, this is simply the total supply
     * @return The total BTC value (in 1e18 units)
     */
    function totalBTCValue() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Returns the BTC value of a user's lstBTC balance
     * @dev Since 1 lstBTC = 1 BTC, this is simply the user's balance
     * @param user The user's address
     * @return The BTC value of the user's lstBTC balance
     */
    function userBTCValue(address user) external view returns (uint256) {
        return balanceOf(user);
    }
}
