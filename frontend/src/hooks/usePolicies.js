import { useState, useEffect, useCallback } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS } from "../utils/constants";
import { CLAIMCHAIN_ABI } from "../utils/contractABI";
import { PolicyStatus } from "../utils/constants";

/**
 * usePolicies
 *
 * Fetches the full Policy struct for each policyId in the provided array.
 * Also polls for contract events (PolicyCreated, PolicyPaidOut) and maintains
 * a running event log.
 *
 * @param {BigInt[]} policyIds - Array of policy IDs to load
 * @returns {{ policies, isLoading, eventLog, refetch }}
 */
export function usePolicies(policyIds = []) {
  const publicClient = usePublicClient();
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventLog, setEventLog] = useState([]);

  // ── Fetch individual policy structs ──────────────────────────────────── //
  // Serialize policyIds to a stable string so useCallback only re-creates
  // fetchPolicies when the actual IDs change, not on every array reference change.
  const policyIdsKey = policyIds?.map(String).join(",") ?? "";

  const fetchPolicies = useCallback(async () => {
    if (!policyIdsKey) {
      setPolicies([]);
      return;
    }

    setIsLoading(true);
    try {
      const ids = policyIdsKey.split(",").filter(Boolean);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const data = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CLAIMCHAIN_ABI,
              functionName: "getPolicyById",
              args: [BigInt(id)],
            });
            return normalizePolicyStruct(data);
          } catch {
            return null;
          }
        })
      );
      setPolicies(results.filter(Boolean));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyIdsKey, publicClient]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // ── Live event polling ───────────────────────────────────────────────── //
  useEffect(() => {
    if (!publicClient) return;

    let unwatchCreated;
    let unwatchPaidOut;
    let unwatchExpired;
    let unwatchNotMet;

    try {
      unwatchCreated = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CLAIMCHAIN_ABI,
        eventName: "PolicyCreated",
        onLogs: (logs) => {
          logs.forEach((log) => {
            appendEvent({
              type: "PolicyCreated",
              icon: "✈️",
              color: "#6c63ff",
              policyId: log.args.policyId?.toString(),
              detail: `Policy #${log.args.policyId} created for flight ${log.args.flightNumber}`,
              timestamp: Date.now(),
              txHash: log.transactionHash,
            });
          });
          fetchPolicies();
        },
      });

      unwatchPaidOut = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CLAIMCHAIN_ABI,
        eventName: "PolicyPaidOut",
        onLogs: (logs) => {
          logs.forEach((log) => {
            appendEvent({
              type: "PolicyPaidOut",
              icon: "💸",
              color: "#22c55e",
              policyId: log.args.policyId?.toString(),
              detail: `Policy #${log.args.policyId} paid out ${formatUsdc(log.args.amount)} USDC`,
              timestamp: Date.now(),
              txHash: log.transactionHash,
            });
          });
          fetchPolicies();
        },
      });

      unwatchExpired = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CLAIMCHAIN_ABI,
        eventName: "PolicyExpired",
        onLogs: (logs) => {
          logs.forEach((log) => {
            appendEvent({
              type: "PolicyExpired",
              icon: "⏰",
              color: "#f59e0b",
              policyId: log.args.policyId?.toString(),
              detail: `Policy #${log.args.policyId} expired`,
              timestamp: Date.now(),
              txHash: log.transactionHash,
            });
          });
          fetchPolicies();
        },
      });

      unwatchNotMet = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CLAIMCHAIN_ABI,
        eventName: "TriggerNotMet",
        onLogs: (logs) => {
          logs.forEach((log) => {
            appendEvent({
              type: "TriggerNotMet",
              icon: "🔍",
              color: "#94a3b8",
              policyId: log.args.policyId?.toString(),
              detail: `Policy #${log.args.policyId}: delay = ${log.args.delayMinutes} min (threshold not met)`,
              timestamp: Date.now(),
              txHash: log.transactionHash,
            });
          });
        },
      });
    } catch {
      // Event watching may fail on some networks; polling is the fallback.
    }

    return () => {
      unwatchCreated?.();
      unwatchPaidOut?.();
      unwatchExpired?.();
      unwatchNotMet?.();
    };
  }, [publicClient, fetchPolicies]);

  function appendEvent(entry) {
    setEventLog((prev) => [entry, ...prev].slice(0, 50)); // keep last 50
  }

  return {
    policies,
    isLoading,
    eventLog,
    refetch: fetchPolicies,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────── //

function normalizePolicyStruct(raw) {
  return {
    policyId: raw.policyId,
    policyholder: raw.policyholder,
    flightNumber: raw.flightNumber,
    flightDate: raw.flightDate,
    premiumPaid: raw.premiumPaid,
    payoutAmount: raw.payoutAmount,
    purchaseTime: raw.purchaseTime,
    status: Number(raw.status),
    triggerConfirmed: raw.triggerConfirmed,
  };
}

function formatUsdc(rawAmount) {
  if (rawAmount === undefined || rawAmount === null) return "0";
  return (Number(rawAmount) / 1_000_000).toFixed(2);
}
