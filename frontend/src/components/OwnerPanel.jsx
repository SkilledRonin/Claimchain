import { useState } from "react";
import { motion } from "framer-motion";
import { useContract } from "../hooks/useContract";

export default function OwnerPanel({ onTriggered }) {
  const { contractOwner, userAddress, mockTriggerPayout, isWritePending, refetchAll } = useContract();

  const [policyIdInput, setPolicyIdInput] = useState("");
  const [status, setStatus]               = useState("idle");
  const [errorMsg, setErrorMsg]           = useState("");
  const [txHash, setTxHash]               = useState(null);

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
    <motion.div
      className="glass-card owner-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="owner-banner">
        <span className="owner-badge">⚡ Demo Mode</span>
        <span className="owner-only-label">Owner Only</span>
      </div>

      <div className="card-title-row">
        <span className="card-icon">🎛️</span>
        <div>
          <h2 className="card-heading">Simulate Delay & Payout</h2>
          <p className="card-subheading">Bypass oracle · Instantly trigger payout for any Active policy</p>
        </div>
      </div>

      {status === "success" ? (
        <motion.div
          className="trigger-success-box"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="trigger-success-icon">✅</div>
          <p>Payout triggered successfully!</p>
          {txHash && <p className="tx-hash-line mono">{txHash.slice(0, 22)}…</p>}
          <button className="btn-secondary" onClick={reset}>Trigger Another</button>
        </motion.div>
      ) : (
        <form onSubmit={handleTrigger} id="mock-trigger-form">
          <div className="form-field">
            <label className="field-label" htmlFor="mock-policy-id">Policy ID</label>
            <input
              id="mock-policy-id"
              type="number"
              min="1"
              step="1"
              className="field-input"
              placeholder="e.g. 1"
              value={policyIdInput}
              onChange={(e) => setPolicyIdInput(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          {errorMsg && (
            <div className="alert-error-box" role="alert">⚠️ {errorMsg}</div>
          )}

          <button
            type="submit"
            id="mock-trigger-btn"
            className="btn-amber btn-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? <><span className="spinner-sm" /> Sending…</> : "⚡ Simulate Delay & Payout"}
          </button>

          <p className="owner-warning">⚠ Testnet only · Do not use on mainnet</p>
        </form>
      )}
    </motion.div>
  );
}
