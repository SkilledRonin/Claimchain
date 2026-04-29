import { useReadContract, useWriteContract } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS, USDC_ADDRESS, CHAIN_ID } from "../utils/constants";
import { CLAIMCHAIN_ABI, MOCKUSDC_ABI } from "../utils/contractABI";

/**
 * useContract — low-level hook that exposes read + write helpers
 * for both ClaimChain and MockUSDC contracts.
 *
 * Higher-level hooks (usePolicies, etc.) compose on top of this.
 */
export function useContract() {
  const { address: userAddress } = useAccount();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  // ── ClaimChain reads ─────────────────────────────────────────────────── //

  const { data: policyCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLAIMCHAIN_ABI,
    functionName: "policyCounter",
  });

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLAIMCHAIN_ABI,
    functionName: "owner",
  });

  const { data: userPolicyIds, refetch: refetchUserPolicies } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLAIMCHAIN_ABI,
    functionName: "getUserPolicies",
    args: [userAddress],
    query: { enabled: Boolean(userAddress) },
  });

  // ── USDC reads ───────────────────────────────────────────────────────── //

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: MOCKUSDC_ABI,
    functionName: "balanceOf",
    args: [userAddress],
    query: { enabled: Boolean(userAddress) },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: MOCKUSDC_ABI,
    functionName: "allowance",
    args: [userAddress, CONTRACT_ADDRESS],
    query: { enabled: Boolean(userAddress) },
  });

  // ── Write helpers ────────────────────────────────────────────────────── //

  async function approveUsdc(amount) {
    return writeContractAsync({
      address: USDC_ADDRESS,
      abi: MOCKUSDC_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
      account: userAddress,
    });
  }

  async function purchasePolicy(flightNumber, flightDate) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CLAIMCHAIN_ABI,
      functionName: "purchasePolicy",
      args: [flightNumber, flightDate],
      account: userAddress,
    });
  }

  async function mockTriggerPayout(policyId) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CLAIMCHAIN_ABI,
      functionName: "mockTriggerPayout",
      args: [BigInt(policyId)],
      account: userAddress,
    });
  }

  async function expirePolicy(policyId) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CLAIMCHAIN_ABI,
      functionName: "expirePolicy",
      args: [BigInt(policyId)],
      account: userAddress,
    });
  }

  async function claimFaucet() {
    return writeContractAsync({
      address: USDC_ADDRESS,
      abi: MOCKUSDC_ABI,
      functionName: "faucet",
      account: userAddress,
    });
  }

  function refetchAll() {
    refetchCounter();
    refetchUserPolicies();
    refetchBalance();
    refetchAllowance();
  }

  return {
    // State
    userAddress,
    contractOwner,
    policyCounter: policyCounter ?? 0n,
    userPolicyIds: userPolicyIds ?? [],
    usdcBalance: usdcBalance ?? 0n,
    usdcAllowance: usdcAllowance ?? 0n,
    isWritePending,
    // Actions
    approveUsdc,
    purchasePolicy,
    mockTriggerPayout,
    expirePolicy,
    claimFaucet,
    refetchAll,
    refetchBalance,
    refetchAllowance,
  };
}
