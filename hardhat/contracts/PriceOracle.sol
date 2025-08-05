// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title PriceOracle for lstBTC Vault
/// @notice Stores and provides token prices, updated by an authorized backend
contract PriceOracle {
    address public owner;

    // Use this constant to represent CORE (native token)
    address public constant CORE_NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    mapping(address => uint256) public prices;         // token → price (1e18-scaled)
    mapping(address => uint256) public lastUpdated;    // token → timestamp

    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set price of token in 1e18 scale
    function setPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        prices[token] = price;
        lastUpdated[token] = block.timestamp;
        emit PriceUpdated(token, price, block.timestamp);
    }

    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }

    function getLastUpdated(address token) external view returns (uint256) {
        return lastUpdated[token];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
