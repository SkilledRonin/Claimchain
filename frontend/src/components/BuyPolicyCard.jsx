import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";
import { PREMIUM_RAW, PAYOUT_RAW } from "../utils/constants";

const STEPS = { IDLE: "idle", APPROVING: "approving", PURCHASING: "purchasing", SUCCESS: "success", ERROR: "error" };

export default function BuyPolicyCard({ onPolicyPurchased, onToast }) {
  const { usdcBalance, usdcAllowance, approveUsdc, purchasePolicy, refetchAll } = useContract();

  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate]     = useState("");
  const [step, setStep]                 = useState(STEPS.IDLE);
  const [errorMsg, setErrorMsg]         = useState("");
  const [txHash, setTxHash]             = useState(null);

  useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });

  const needsApproval = usdcAllowance < PREMIUM_RAW;
  const hasBalance    = usdcBalance >= PREMIUM_RAW;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!flightNumber.trim()) return setErrorMsg("Please enter a flight number.");
    if (!flightDate)          return setErrorMsg("Please select a flight date.");
    if (!hasBalance)          return setErrorMsg("Insufficient USDC. Use the Faucet button in the header.");

    try {
      if (needsApproval) {
        setStep(STEPS.APPROVING);
        const approveTx = await approveUsdc(PREMIUM_RAW * 10n);
        setTxHash(approveTx);
        await new Promise((r) => setTimeout(r, 2000));
      }

      setStep(STEPS.PURCHASING);
      const purchaseTx = await purchasePolicy(flightNumber.trim().toUpperCase(), flightDate);
      setTxHash(purchaseTx);
      await new Promise((r) => setTimeout(r, 2000));

      setStep(STEPS.SUCCESS);
      refetchAll();
      onPolicyPurchased?.();

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#7C3AED","#A855F7","#60A5FA","#10B981"] });

      onToast?.({ id: Date.now(), type: "success", title: "Policy purchased!", subtitle: `Flight ${flightNumber.toUpperCase()} is now insured.` });
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
  }

  const isLoading = step === STEPS.APPROVING || step === STEPS.PURCHASING;
  const btnLabel = step === STEPS.APPROVING
    ? "Approving USDC…"
    : step === STEPS.PURCHASING
    ? "Purchasing Policy…"
    : needsApproval
    ? "Approve & Insure Flight"
    : "Insure This Flight";

  if (step === STEPS.SUCCESS) {
    return (
      <motion.div
        className="glass-card buy-policy-card success-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="success-circle">✅</div>
        <h3>Policy Active!</h3>
        <p className="success-sub">
          Your flight <strong>{flightNumber.toUpperCase()}</strong> on <strong>{flightDate}</strong> is insured.<br />
          If delayed ≥ 2h you'll automatically receive <strong className="green">{Number(PAYOUT_RAW) / 1_000_000} USDC</strong>.
        </p>
        <button className="btn-violet btn-full" onClick={reset}>Insure Another Flight</button>
      </motion.div>
    );
  }

  return (
    <div className="glass-card buy-policy-card glow-violet-hover">
      <div className="card-title-row">
        <span className="card-icon">✈️</span>
        <div>
          <h2 className="card-heading">Insure Your Flight</h2>
          <p className="card-subheading">Pay 1 USDC · Get 3 USDC if delayed ≥ 2h</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="buy-policy-form">
        <div className="form-field">
          <label className="field-label" htmlFor="flight-number">Flight Number (IATA)</label>
          <input
            id="flight-number"
            type="text"
            className="field-input"
            placeholder="e.g. AA123"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            maxLength={8}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="flight-date">Flight Date</label>
          <input
            id="flight-date"
            type="date"
            className="field-input"
            value={flightDate}
            onChange={(e) => setFlightDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="policy-summary-grid">
          <div className="sum-row"><span>Premium</span><span className="mono">1.00 USDC</span></div>
          <div className="sum-row"><span>Max Payout</span><span className="mono green">3.00 USDC</span></div>
          <div className="sum-row"><span>Trigger</span><span>≥ 2 hour delay</span></div>
          <div className="sum-row">
            <span>Your Balance</span>
            <span className={`mono ${hasBalance ? "" : "red"}`}>
              {(Number(usdcBalance) / 1_000_000).toFixed(2)} USDC
            </span>
          </div>
        </div>

        {errorMsg && (
          <motion.div
            className="alert-error-box"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        <button
          type="submit"
          id="purchase-policy-btn"
          className={`buy-btn ${step === STEPS.SUCCESS ? "buy-btn-success" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner-chain" /> : null}
          {isLoading ? btnLabel : btnLabel}
        </button>
      </form>
    </div>
  );
}
