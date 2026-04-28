// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A mock ERC-20 token representing USDC for local and testnet testing.
 *         Uses 6 decimal places to mirror real USDC behaviour.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor(address initialOwner)
        ERC20("Mock USD Coin", "USDC")
        Ownable(initialOwner)
    {}

    /**
     * @notice Returns 6 decimals to mirror real USDC.
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mints tokens to a target address. Only callable by the contract owner.
     * @param to      Recipient address.
     * @param amount  Amount in raw units (1 USDC = 1_000_000).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Convenience faucet: lets any address mint up to 1,000 USDC for
     *         testing without needing the owner to approve each request.
     */
    function faucet() external {
        _mint(msg.sender, 1_000 * 10 ** DECIMALS);
    }
}
