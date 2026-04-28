import { useState } from "react";
import { useContract } from "../hooks/useContract";

/**
 * MockTriggerToggle — DEMO MODE owner-only panel.
 *
 * Visible only when the connected wallet matches the contract owner.
 * Calls `mockTriggerPayout(policyId)` on-chain without any oracle check —
 * instantly simulating a ≥ 2-hour delay and releasing the payout.
 */
export default function MockTriggerToggle({ onTriggered }) {
  const { contractOwner, userAddress, mockTriggerPayout, isWritePending, refetchAll } =
    useContract();

  const [policyIdInput, setPolicyIdInput] = useState("");
  const [status, setStatus]               = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg]           = useState("");
  const [txHash, setTxHash]               = useState(null);

  // Gate — only render if connected wallet is the owner
  const isOwner =
    userAddress &&
    contractOwner &&
    userAddress.toLowerCase() === contractOwner.toLowerCase();

  if (!isOwner) return null;

  async function handleTrigger(e) {
    e.preventDefault();
    const id = policyIdInput.trim();
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      setErrorMsg("Please enter a valid positive policy ID.");
      return;
    }

    setErrorMsg("");
    setStatus("loading");

    try {
      const hash = await mockTriggerPayout(id);
      setTxHash(hash);
      setStatus("success");
      refetchAll();
      onTriggered?.();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.shortMessage ?? err?.message ?? "Transaction failed.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPolicyIdInput("");
    setErrorMsg("");
    setTxHash(null);
  }

  return (
    <div className="mock-trigger-panel" id="mock-trigger-panel">
      {/* ── Warning Banner ── */}
      <div className="demo-banner">
        <span className="demo-badge">🔑 DEMO MODE — Owner Only</span>
        <p>
          This panel bypasses the Chainlink oracle and instantly triggers a payout.
          Only visible to the contract owner wallet. <strong>Do not use on mainnet.</strong>
        </p>
      </div>

      <div className="card mock-trigger-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="title-icon">⚡</span> Simulate Flight Delay
          </h3>
          <p className="card-subtitle">
            Instantly release payout for any Active policy without waiting for
            the oracle. Simulates a confirmed ≥ 2-hour delay.
          </p>
        </div>

        {status === "success" ? (
          <div className="trigger-success">
            <div className="success-icon">✅</div>
            <p>Payout triggered successfully!</p>
            {txHash && (
              <p className="tx-hash">
                Tx: <span className="mono">{txHash.slice(0, 20)}…</span>
              </p>
            )}
            <button className="btn btn-secondary" onClick={reset}>
              Trigger Another
            </button>
          </div>
        ) : (
          <form className="mock-trigger-form" onSubmit={handleTrigger} id="mock-trigger-form">
            <div className="form-group">
              <label htmlFor="mock-policy-id" className="form-label">
                Policy ID
              </label>
              <input
                id="mock-policy-id"
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="e.g. 1"
                value={policyIdInput}
                onChange={(e) => setPolicyIdInput(e.target.value)}
                disabled={status === "loading"}
              />
            </div>

            {errorMsg && (
              <div className="alert alert-error" role="alert">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              id="mock-trigger-btn"
              className="btn btn-danger btn-full"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "⏳ Sending transaction…"
                : "⚡ Simulate Delay & Trigger Payout"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
