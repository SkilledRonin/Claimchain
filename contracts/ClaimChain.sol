// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "./interfaces/IClaimChain.sol";

/**
 * @title ClaimChain
 * @notice Parametric flight-delay micro-insurance protocol.
 *         Premiums are collected in USDC; payouts are triggered automatically
 *         by Chainlink Functions when a flight is delayed ≥ 2 hours.
 *         Chainlink Automation polls active policies on a schedule.
 *
 * @dev    For local/testnet demo the `mockTriggerPayout` owner-only function
 *         bypasses the oracle and instantly releases funds — use this for demos.
 */
contract ClaimChain is
    IClaimChain,
    FunctionsClient,
    AutomationCompatibleInterface,
    ReentrancyGuard,
    Ownable
{
    using SafeERC20 for IERC20;
    using FunctionsRequest for FunctionsRequest.Request;

    // ─────────────────────────── Constants ──────────────────────────────── //

    /// @notice Minimum delay (in minutes) to trigger a payout.
    uint256 public constant DELAY_THRESHOLD_MINUTES = 120;

    /// @notice Payout is PAYOUT_MULTIPLIER × premium paid.
    uint256 public constant PAYOUT_MULTIPLIER = 3;

    /// @notice Fixed premium for MVP: 1 USDC (6 decimals).
    uint256 public constant PREMIUM_AMOUNT = 1_000_000;

    /// @notice Chainlink Functions gas limit for the callback.
    uint32 public constant FUNCTIONS_GAS_LIMIT = 300_000;

    // ─────────────────────────── State Variables ─────────────────────────── //

    /// @notice USDC token used for premiums and payouts.
    IERC20 public immutable usdcToken;

    /// @notice Address that collects expired-policy premiums.
    address public insurerTreasury;

    /// @notice Chainlink DON ID (encoded as bytes32).
    bytes32 public donId;

    /// @notice Chainlink Functions subscription ID.
    uint64 public subscriptionId;

    /// @notice Chainlink Functions JS source stored on-chain for transparency.
    string public flightStatusSource;

    /// @notice Monotonically incrementing policy ID counter.
    uint256 public policyCounter;

    /// @dev policyId → Policy struct.
    mapping(uint256 => Policy) private _policies;

    /// @dev user address → list of their policyIds.
    mapping(address => uint256[]) private _userPolicies;

    /// @dev Chainlink requestId → policyId, used in fulfillRequest callback.
    mapping(bytes32 => uint256) public requestIdToPolicy;

    /// @dev policyIds currently queued for an oracle check by the Keeper.
    uint256[] private _pendingOracleChecks;

    // ─────────────────────────── Constructor ─────────────────────────────── //

    /**
     * @param _router          Chainlink Functions router address for the network.
     * @param _donId           Chainlink DON ID for the network.
     * @param _subscriptionId  Chainlink Functions subscription ID.
     * @param _usdcAddress     USDC ERC-20 token address.
     * @param _insurerTreasury Address to receive expired-policy premiums.
     * @param _flightSource    Chainlink Functions JS source code string.
     */
    constructor(
        address _router,
        bytes32 _donId,
        uint64 _subscriptionId,
        address _usdcAddress,
        address _insurerTreasury,
        string memory _flightSource
    )
        FunctionsClient(_router)
        Ownable(msg.sender)
    {
        require(_usdcAddress != address(0), "ClaimChain: zero USDC address");
        require(_insurerTreasury != address(0), "ClaimChain: zero treasury address");

        donId = _donId;
        subscriptionId = _subscriptionId;
        usdcToken = IERC20(_usdcAddress);
        insurerTreasury = _insurerTreasury;
        flightStatusSource = _flightSource;
    }

    // ─────────────────────────── Policy Lifecycle ────────────────────────── //

    /**
     * @notice Purchase a flight-delay insurance policy.
     * @param flightNumber  IATA flight code, e.g. "AA123".
     * @param flightDate    ISO date string, e.g. "2024-12-25".
     * @return policyId     The newly created policy ID.
     *
     * @dev Caller must have pre-approved this contract to spend PREMIUM_AMOUNT
     *      of USDC before calling this function.
     */
    function purchasePolicy(
        string calldata flightNumber,
        string calldata flightDate
    ) external nonReentrant returns (uint256 policyId) {
        require(bytes(flightNumber).length > 0, "ClaimChain: empty flight number");
        require(bytes(flightDate).length > 0, "ClaimChain: empty flight date");

        uint256 payoutAmount = PREMIUM_AMOUNT * PAYOUT_MULTIPLIER;

        // Ensure the contract holds enough USDC to cover this payout.
        require(
            usdcToken.balanceOf(address(this)) >= payoutAmount,
            "ClaimChain: insufficient liquidity for payout"
        );

        // Transfer the premium from the buyer to this contract.
        usdcToken.safeTransferFrom(msg.sender, address(this), PREMIUM_AMOUNT);

        policyId = ++policyCounter;

        _policies[policyId] = Policy({
            policyId: policyId,
            policyholder: msg.sender,
            flightNumber: flightNumber,
            flightDate: flightDate,
            premiumPaid: PREMIUM_AMOUNT,
            payoutAmount: payoutAmount,
            purchaseTime: block.timestamp,
            status: PolicyStatus.Active,
            triggerConfirmed: false
        });

        _userPolicies[msg.sender].push(policyId);

        emit PolicyCreated(policyId, msg.sender, flightNumber);
    }

    // ─────────────────────────── Chainlink Automation ────────────────────── //

    /**
     * @notice Chainlink Automation off-chain simulation: returns true when at
     *         least one Active policy exists that needs an oracle status check.
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        for (uint256 i = 1; i <= policyCounter; i++) {
            if (_policies[i].status == PolicyStatus.Active) {
                upkeepNeeded = true;
                performData = abi.encode(i);
                return (upkeepNeeded, performData);
            }
        }
        return (false, "");
    }

    /**
     * @notice Chainlink Automation on-chain execution: decodes the policy ID
     *         and fires an oracle request for it.
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256 policyId = abi.decode(performData, (uint256));
        _requestFlightStatus(policyId);
    }

    // ─────────────────────────── Chainlink Functions ─────────────────────── //

    /**
     * @notice Build and send a Chainlink Functions request for a given policy.
     * @dev    Internal — called by performUpkeep or directly by the owner for
     *         manual testing.
     */
    function _requestFlightStatus(uint256 policyId) internal {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "ClaimChain: policy not active");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(flightStatusSource);

        string[] memory args = new string[](2);
        args[0] = policy.flightNumber;
        args[1] = policy.flightDate;
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            FUNCTIONS_GAS_LIMIT,
            donId
        );

        requestIdToPolicy[requestId] = policyId;
        emit OracleRequestSent(policyId, requestId);
    }

    /**
     * @notice Public wrapper so the owner can manually trigger an oracle check.
     */
    function requestFlightStatusManual(uint256 policyId) external onlyOwner {
        _requestFlightStatus(policyId);
    }

    /**
     * @notice Chainlink Functions callback. Decodes the delay minutes and
     *         triggers a payout if the threshold is met.
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 policyId = requestIdToPolicy[requestId];
        require(policyId != 0, "ClaimChain: unknown request");

        // If the oracle reported an error, emit and bail.
        if (err.length > 0) {
            emit TriggerNotMet(policyId, 0);
            return;
        }

        uint256 delayMinutes = abi.decode(response, (uint256));

        if (delayMinutes >= DELAY_THRESHOLD_MINUTES) {
            _policies[policyId].triggerConfirmed = true;
            _executePayout(policyId);
        } else {
            emit TriggerNotMet(policyId, delayMinutes);
        }
    }

    // ─────────────────────────── Payout Logic ────────────────────────────── //

    /**
     * @notice Internal payout execution. Transfers payoutAmount USDC to the
     *         policyholder and marks the policy as PaidOut.
     */
    function _executePayout(uint256 policyId) internal {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "ClaimChain: policy not active");

        policy.status = PolicyStatus.PaidOut;

        usdcToken.safeTransfer(policy.policyholder, policy.payoutAmount);

        emit PolicyPaidOut(policyId, policy.policyholder, policy.payoutAmount);
    }

    // ─────────────────────────── Admin Functions ─────────────────────────── //

    /**
     * @notice Expires an active policy and sweeps the premium to the treasury.
     * @dev    Callable by the owner or a Keeper. In production this would also
     *         verify that the flight date has passed.
     */
    function expirePolicy(uint256 policyId) external onlyOwner {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "ClaimChain: policy not active");

        policy.status = PolicyStatus.Expired;

        usdcToken.safeTransfer(insurerTreasury, policy.premiumPaid);

        emit PolicyExpired(policyId);
    }

    /**
     * @notice DEMO ONLY — owner-only bypass that triggers a payout without
     *         going through the oracle. Useful for localhost demos and QA.
     * @param policyId  The policy to pay out.
     */
    function mockTriggerPayout(uint256 policyId) external onlyOwner {
        _policies[policyId].triggerConfirmed = true;
        _executePayout(policyId);
    }

    // ─────────────────────────── View Functions ──────────────────────────── //

    /// @notice Returns the full Policy struct for a given ID.
    function getPolicyById(uint256 policyId)
        external
        view
        returns (Policy memory)
    {
        return _policies[policyId];
    }

    /// @notice Returns all policy IDs belonging to a user.
    function getUserPolicies(address user)
        external
        view
        returns (uint256[] memory)
    {
        return _userPolicies[user];
    }

    // ─────────────────────────── Owner Configuration ──────────────────────── //

    /// @notice Update the Chainlink Functions source code stored on-chain.
    function setFlightStatusSource(string calldata source) external onlyOwner {
        flightStatusSource = source;
    }

    /// @notice Update the Chainlink subscription ID.
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /// @notice Update the Chainlink DON ID.
    function setDonId(bytes32 _donId) external onlyOwner {
        donId = _donId;
    }

    /// @notice Update the insurer treasury address.
    function setInsurerTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "ClaimChain: zero treasury address");
        insurerTreasury = _treasury;
    }

    /// @notice Emergency withdrawal of USDC held by the contract (owner only).
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        usdcToken.safeTransfer(owner(), amount);
    }
}
