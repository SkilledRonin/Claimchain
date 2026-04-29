import { PolicyStatusLabel, PolicyStatus } from "../utils/constants";
import { motion } from "framer-motion";

const STATUS_CONFIG = {
  [PolicyStatus.Active]:   { cls: "status-active",   icon: null,  label: "Active",   dot: "amber" },
  [PolicyStatus.PaidOut]:  { cls: "status-paid",     icon: "✓",   label: "Paid Out", dot: "green" },
  [PolicyStatus.Expired]:  { cls: "status-expired",  icon: null,  label: "Expired",  dot: "gray" },
  [PolicyStatus.Disputed]: { cls: "status-disputed", icon: "⚠",   label: "Disputed", dot: "red" },
};

export default function PolicyCard({ policy }) {
  const cfg = STATUS_CONFIG[policy.status] ?? STATUS_CONFIG[PolicyStatus.Active];
  const premiumUsdc  = (Number(policy.premiumPaid) / 1_000_000).toFixed(2);
  const payoutUsdc   = (Number(policy.payoutAmount) / 1_000_000).toFixed(2);
  const purchaseDate = new Date(Number(policy.purchaseTime) * 1000).toLocaleDateString();
  const isPaidOut    = policy.status === PolicyStatus.PaidOut;
  const isActive     = policy.status === PolicyStatus.Active;

  return (
    <motion.div
      className={`policy-card-new glass-card ${cfg.cls}`}
      whileHover={{ y: -4, boxShadow: "0 0 28px rgba(124,58,237,0.35)" }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      layout
    >
      {/* Header row */}
      <div className="pc-top">
        <div className="pc-flight-info">
          <span className="pc-plane-icon">✈</span>
          <div>
            <div className="pc-flight-num">{policy.flightNumber}</div>
            <div className="pc-flight-date">{policy.flightDate}</div>
          </div>
        </div>
        <span className={`status-badge ${cfg.cls}`}>
          {isActive && <span className="pulse-dot" />}
          {cfg.icon && <span className="badge-icon">{cfg.icon}</span>}
          {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="pc-stats">
        <div className="pc-stat-item">
          <span className="pc-stat-label">Policy ID</span>
          <span className="pc-stat-value mono">#{policy.policyId.toString()}</span>
        </div>
        <div className="pc-stat-item">
          <span className="pc-stat-label">Premium</span>
          <span className="pc-stat-value mono">{premiumUsdc} USDC</span>
        </div>
        <div className="pc-stat-item">
          <span className="pc-stat-label">Max Payout</span>
          <span className={`pc-stat-value mono ${isPaidOut ? "green" : ""}`}>{payoutUsdc} USDC</span>
        </div>
        <div className="pc-stat-item">
          <span className="pc-stat-label">Oracle</span>
          <span className="pc-stat-value">{policy.triggerConfirmed ? "✅ Confirmed" : "—"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pc-footer-row">
        <span className="pc-purchased">Purchased {purchaseDate}</span>
        {isPaidOut && <span className="payout-badge">🎉 Payout Sent</span>}
      </div>

      {/* Active progress bar */}
      {isActive && <div className="pc-active-bar" />}
    </motion.div>
  );
}
