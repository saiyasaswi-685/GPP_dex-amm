// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock ERC20 Token for Testing
/// @notice Simple ERC20 token used for DEX testing
contract MockERC20 is ERC20 {

    /// @notice Constructor mints 1,000,000 tokens to deployer
    /// @param name Token name
    /// @param symbol Token symbol
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Mint tokens for testing
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
