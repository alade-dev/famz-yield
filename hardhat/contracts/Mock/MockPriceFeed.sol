// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title MockPriceFeed
/// @notice Mock Chainlink price feed for testing
contract MockPriceFeed {
    int256 private _price;
    uint8 private _decimals = 18;

    constructor(int256 initialPrice) {
        _price = initialPrice;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            1, // roundId
            _price, // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function setPrice(int256 newPrice) external {
        _price = newPrice;
    }

    function setDecimals(uint8 newDecimals) external {
        _decimals = newDecimals;
    }
}
