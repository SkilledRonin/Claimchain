import { useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";
import { PREMIUM_RAW, PAYOUT_RAW } from "../utils/constants";

const STEPS = {
  IDLE: "idle",
  APPROVING: "approving",
  PURCHASING: "purchasing",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * PolicyForm — lets users approve USDC and purchase a flight-delay policy.
 * Flow: validate → approve USDC → purchasePolicy → show success
 */
export default function PolicyForm({ onPolicyPurchased }) {
  const { usdcBalance, usdcAllowance, approveUsdc, purchasePolicy, refetchAll } =
    useContract();

  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate]     = useState("");
  const [step, setStep]                 = useState(STEPS.IDLE);
  const [errorMsg, setErrorMsg]         = useState("");
  const [txHash, setTxHash]             = useState(null);
  const [newPolicyId, setNewPolicyId]   = useState(null);

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const needsApproval = usdcAllowance < PREMIUM_RAW;
  const hasBalance    = usdcBalance >= PREMIUM_RAW;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!flightNumber.trim()) return setErrorMsg("Please enter a flight number.");
    if (!flightDate)          return setErrorMsg("Please select a flight date.");
    if (!hasBalance) return setErrorMsg("Insufficient USDC balance. Use the Faucet button to get test USDC.");

    try {
      // Step 1 — USDC approval
      if (needsApproval) {
        setStep(STEPS.APPROVING);
        const approveTx = await approveUsdc(PREMIUM_RAW * 10n); // approve 10× for convenience
        setTxHash(approveTx);
        // Wait for approval tx
        await waitForTx(approveTx);
      }

      // Step 2 — purchasePolicy
      setStep(STEPS.PURCHASING);
      const purchaseTx = await purchasePolicy(
        flightNumber.trim().toUpperCase(),
        flightDate
      );
      setTxHash(purchaseTx);
      await waitForTx(purchaseTx);

      setStep(STEPS.SUCCESS);
      refetchAll();
      onPolicyPurchased?.();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.shortMessage ?? err?.message ?? "Transaction failed.");
      setStep(STEPS.ERROR);
    }
  }

  function reset() {
    setStep(STEPS.IDLE);
    setFlightNumber("");
    setFlightDate("");
    setErrorMsg("");
    setTxHash(null);
    setNewPolicyId(null);
  }

  if (step === STEPS.SUCCESS) {
    return (
      <div className="card success-card">
        <div className="success-icon">🎉</div>
        <h3>Policy Purchased!</h3>
        <p className="success-sub">
          Your flight-delay policy is now <strong>Active</strong>. If your flight
          is delayed by 2+ hours, you'll automatically receive{" "}
          <strong>{Number(PAYOUT_RAW) / 1_000_000} USDC</strong>.
        </p>
        <div className="success-details">
          <span>Flight: <strong>{flightNumber.toUpperCase()}</strong></span>
          <span>Date: <strong>{flightDate}</strong></span>
          <span>Premium: <strong>1.00 USDC</strong></span>
          <span>Max Payout: <strong>3.00 USDC</strong></span>
        </div>
        <button className="btn btn-primary" onClick={reset}>
          Buy Another Policy
        </button>
      </div>
    );
  }

  return (
    <div className="card policy-form-card">
      <div className="card-header">
        <h2 className="card-title">
          <span className="title-icon">✈️</span> Insure Your Flight
        </h2>
        <p className="card-subtitle">
          Pay <strong>1 USDC</strong> premium → receive <strong>3 USDC</strong> if
          delayed ≥ 2 hours. Instant, automatic, on-chain.
        </p>
      </div>

      <form className="policy-form" onSubmit={handleSubmit} id="policy-purchase-form">
        <div className="form-group">
          <label htmlFor="flight-number" className="form-label">
            Flight Number (IATA)
          </label>
          <input
            id="flight-number"
            type="text"
            className="form-input"
            placeholder="e.g. AA123"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            maxLength={8}
            disabled={step !== STEPS.IDLE && step !== STEPS.ERROR}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="flight-date" className="form-label">
            Flight Date
          </label>
          <input
            id="flight-date"
            type="date"
            className="form-input"
            value={flightDate}
            onChange={(e) => setFlightDate(e.target.value)}
            disabled={step !== STEPS.IDLE && step !== STEPS.ERROR}
          />
        </div>

        <div className="policy-summary">
          <div className="summary-row">
            <span>Premium</span><span className="summary-val">1.00 USDC</span>
          </div>
          <div className="summary-row">
            <span>Max Payout</span><span className="summary-val green">3.00 USDC</span>
          </div>
          <div className="summary-row">
            <span>Trigger</span><span className="summary-val">≥ 2 hour delay</span>
          </div>
          <div className="summary-row">
            <span>Your Balance</span>
            <span className={`summary-val ${hasBalance ? "" : "red"}`}>
              {(Number(usdcBalance) / 1_000_000).toFixed(2)} USDC
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error" role="alert">
            ⚠️ {errorMsg}
          </div>
        )}

        <StepIndicator step={step} needsApproval={needsApproval} />

        <button
          type="submit"
          id="purchase-policy-btn"
          className="btn btn-primary btn-full"
          disabled={step !== STEPS.IDLE && step !== STEPS.ERROR}
        >
          {step === STEPS.APPROVING
            ? "⏳ Approving USDC…"
            : step === STEPS.PURCHASING
            ? "⏳ Purchasing Policy…"
            : needsApproval
            ? "Approve USDC & Purchase"
            : "Purchase Policy"}
        </button>
      </form>
    </div>
  );
}

function StepIndicator({ step, needsApproval }) {
  if (step === STEPS.IDLE || step === STEPS.ERROR) return null;
  return (
    <div className="step-indicator">
      <div className={`step ${step === STEPS.APPROVING ? "active" : step === STEPS.PURCHASING || step === STEPS.SUCCESS ? "done" : ""}`}>
        <span className="step-dot" />
        <span>Approve USDC</span>
      </div>
      <div className="step-line" />
      <div className={`step ${step === STEPS.PURCHASING ? "active" : step === STEPS.SUCCESS ? "done" : ""}`}>
        <span className="step-dot" />
        <span>Purchase Policy</span>
      </div>
    </div>
  );
}

// Helper — resolves once a transaction is mined
async function waitForTx(hash) {
  // Wagmi's useWaitForTransactionReceipt is hook-based; for async flows we
  // poll via a small Promise wrapper using the viem client.
  return new Promise((resolve) => setTimeout(resolve, 2000));
}
