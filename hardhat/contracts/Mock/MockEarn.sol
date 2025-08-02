// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockEarn {
    uint256 public currentExchangeRate = 1e6;
    uint256 public stcoreBalance;

    function getCurrentExchangeRate() external view returns (uint256) {
        return currentExchangeRate;
    }

    function setExchangeRate(uint256 rate) external {
        currentExchangeRate = rate;
    }

    // Simulate balance for Vault
    function setStCoreBalance(uint256 balance) external {
        stcoreBalance = balance;
    }

    function balanceOf(address) external view returns (uint256) {
        return stcoreBalance;
    }
    
    // Receive ETH
    receive() external payable {}
}