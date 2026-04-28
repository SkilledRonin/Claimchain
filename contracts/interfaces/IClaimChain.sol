// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IClaimChain
 * @notice External interface for the ClaimChain parametric insurance protocol.
 */
interface IClaimChain {
    // ─────────────────────────── Enumerations ───────────────────────────── //

    enum PolicyStatus {
        Active,
        PaidOut,
        Expired,
        Disputed
    }

    // ─────────────────────────── Structs ────────────────────────────────── //

    struct Policy {
        uint256 policyId;
        address policyholder;
        string flightNumber;
        string flightDate;
        uint256 premiumPaid;
        uint256 payoutAmount;
        uint256 purchaseTime;
        PolicyStatus status;
        bool triggerConfirmed;
    }

    // ─────────────────────────── Events ─────────────────────────────────── //

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyholder,
        string flightNumber
    );

    event OracleRequestSent(
        uint256 indexed policyId,
        bytes32 indexed requestId
    );

    event PolicyPaidOut(
        uint256 indexed policyId,
        address indexed policyholder,
        uint256 amount
    );

    event TriggerNotMet(
        uint256 indexed policyId,
        uint256 delayMinutes
    );

    event PolicyExpired(uint256 indexed policyId);

    // ─────────────────────────── Functions ──────────────────────────────── //

    function purchasePolicy(
        string calldata flightNumber,
        string calldata flightDate
    ) external returns (uint256 policyId);

    function expirePolicy(uint256 policyId) external;

    function mockTriggerPayout(uint256 policyId) external;

    function getPolicyById(uint256 policyId)
        external
        view
        returns (Policy memory);

    function getUserPolicies(address user)
        external
        view
        returns (uint256[] memory);
}
