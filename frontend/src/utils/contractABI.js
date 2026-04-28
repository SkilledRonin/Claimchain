/**
 * contractABI.js
 * Full ABI for ClaimChain.sol and MockUSDC.sol
 * Keep in sync with the compiled Solidity contracts.
 */

export const CLAIMCHAIN_ABI = [
  // ── View / Pure ──────────────────────────────────────────────────────── //
  {
    inputs: [],
    name: "DELAY_THRESHOLD_MINUTES",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PAYOUT_MULTIPLIER",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PREMIUM_AMOUNT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "policyCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "insurerTreasury",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "policyId", type: "uint256" }],
    name: "getPolicyById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "policyId", type: "uint256" },
          { internalType: "address", name: "policyholder", type: "address" },
          { internalType: "string", name: "flightNumber", type: "string" },
          { internalType: "string", name: "flightDate", type: "string" },
          { internalType: "uint256", name: "premiumPaid", type: "uint256" },
          { internalType: "uint256", name: "payoutAmount", type: "uint256" },
          { internalType: "uint256", name: "purchaseTime", type: "uint256" },
          {
            internalType: "enum IClaimChain.PolicyStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "bool", name: "triggerConfirmed", type: "bool" },
        ],
        internalType: "struct IClaimChain.Policy",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserPolicies",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "requestId", type: "bytes32" }],
    name: "requestIdToPolicy",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ── Write ─────────────────────────────────────────────────────────────── //
  {
    inputs: [
      { internalType: "string", name: "flightNumber", type: "string" },
      { internalType: "string", name: "flightDate", type: "string" },
    ],
    name: "purchasePolicy",
    outputs: [{ internalType: "uint256", name: "policyId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "policyId", type: "uint256" }],
    name: "mockTriggerPayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "policyId", type: "uint256" }],
    name: "expirePolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "policyId", type: "uint256" }],
    name: "requestFlightStatusManual",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ── Events ────────────────────────────────────────────────────────────── //
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "policyholder", type: "address" },
      { indexed: false, internalType: "string", name: "flightNumber", type: "string" },
    ],
    name: "PolicyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: true, internalType: "bytes32", name: "requestId", type: "bytes32" },
    ],
    name: "OracleRequestSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "policyholder", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PolicyPaidOut",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "delayMinutes", type: "uint256" },
    ],
    name: "TriggerNotMet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
    ],
    name: "PolicyExpired",
    type: "event",
  },
];

export const MOCKUSDC_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
