import { PolicyStatusLabel, PolicyStatus } from "../utils/constants";

const STATUS_STYLES = {
  [PolicyStatus.Active]:   { cls: "badge-active",   icon: "🟢" },
  [PolicyStatus.PaidOut]:  { cls: "badge-paid",     icon: "💸" },
  [PolicyStatus.Expired]:  { cls: "badge-expired",  icon: "⏰" },
  [PolicyStatus.Disputed]: { cls: "badge-disputed", icon: "⚠️" },
};

/**
 * PolicyCard — displays a single insurance policy with all its details.
 */
export default function PolicyCard({ policy }) {
  const statusStyle = STATUS_STYLES[policy.status] ?? STATUS_STYLES[PolicyStatus.Active];
  const premiumUsdc  = (Number(policy.premiumPaid) / 1_000_000).toFixed(2);
  const payoutUsdc   = (Number(policy.payoutAmount) / 1_000_000).toFixed(2);
  const purchaseDate = new Date(Number(policy.purchaseTime) * 1000).toLocaleString();

  return (
    <div className={`policy-card ${statusStyle.cls}`}>
      {/* ── Header ── */}
      <div className="pc-header">
        <div className="pc-flight">
          <span className="pc-plane">✈</span>
          <div>
            <span className="pc-flight-number">{policy.flightNumber}</span>
            <span className="pc-flight-date">{policy.flightDate}</span>
          </div>
        </div>
        <span className={`badge ${statusStyle.cls}`}>
          {statusStyle.icon} {PolicyStatusLabel[policy.status]}
        </span>
      </div>

      {/* ── Details ── */}
      <div className="pc-details">
        <div className="pc-stat">
          <span className="pc-stat-label">Policy ID</span>
          <span className="pc-stat-value">#{policy.policyId.toString()}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat-label">Premium Paid</span>
          <span className="pc-stat-value">{premiumUsdc} USDC</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat-label">Max Payout</span>
          <span className="pc-stat-value green">{payoutUsdc} USDC</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat-label">Oracle Confirmed</span>
          <span className="pc-stat-value">
            {policy.triggerConfirmed ? "✅ Yes" : "—"}
          </span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="pc-footer">
        <span className="pc-purchased">Purchased {purchaseDate}</span>
        {policy.status === PolicyStatus.PaidOut && (
          <span className="pc-payout-badge">🎉 Payout Sent</span>
        )}
      </div>

      {/* ── Progress bar for Active policies ── */}
      {policy.status === PolicyStatus.Active && (
        <div className="pc-progress">
          <div className="pc-progress-bar active-pulse" />
        </div>
      )}
    </div>
  );
}
