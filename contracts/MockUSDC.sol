// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A minimal ERC-20 token that mimics USDC behaviour for testing purposes.
 *         Uses 6 decimal places (same as real USDC) and exposes a public `mint`
 *         function so that test wallets can acquire tokens freely.
 *
 * @dev    NOT for production use. Deploy only on local Hardhat or testnets.
 */
contract MockUSDC is ERC20, Ownable {
    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /// @notice Human-readable token name
    string private constant _TOKEN_NAME = "Mock USD Coin";

    /// @notice Human-readable token symbol
    string private constant _TOKEN_SYMBOL = "USDC";

    /// @notice Matches real USDC precision (6 decimal places)
    uint8 private constant _DECIMALS = 6;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * @param initialOwner The address that receives the Ownable ownership.
     *        Typically the deployer. Pass `msg.sender` when deploying manually.
     */
    constructor(address initialOwner)
        ERC20(_TOKEN_NAME, _TOKEN_SYMBOL)
        Ownable(initialOwner)
    {}

    // -----------------------------------------------------------------------
    // Overrides
    // -----------------------------------------------------------------------

    /**
     * @dev Returns 6 to match real USDC decimal precision.
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    // -----------------------------------------------------------------------
    // Public functions
    // -----------------------------------------------------------------------

    /**
     * @notice Mint `amount` tokens to `to`.
     * @dev    Open to everyone in the test environment.
     *         In a more restricted setup you could add `onlyOwner`.
     * @param  to     Recipient address.
     * @param  amount Amount in the smallest unit (1 USDC = 1_000_000).
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Convenience helper: mint exactly `usdcAmount` whole USDC tokens.
     * @param  to         Recipient address.
     * @param  usdcAmount Whole token amount (e.g. 100 for 100 USDC).
     */
    function mintWhole(address to, uint256 usdcAmount) external {
        _mint(to, usdcAmount * (10 ** _DECIMALS));
    }
}
