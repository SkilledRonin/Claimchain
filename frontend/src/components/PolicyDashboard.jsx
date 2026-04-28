import PolicyCard from "./PolicyCard";

/**
 * PolicyDashboard — renders the user's complete policy portfolio.
 * Accepts policies + loading state from the parent (App).
 */
export default function PolicyDashboard({ policies, isLoading }) {
  if (isLoading) {
    return (
      <div className="dashboard-placeholder">
        <div className="spinner" />
        <p>Loading your policies…</p>
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon">🛡️</div>
        <h3>No Policies Yet</h3>
        <p>Purchase your first flight-delay policy above to get started.</p>
      </div>
    );
  }

  // Sort: Active first, then PaidOut, then Expired
  const sorted = [...policies].sort((a, b) => {
    const order = { 0: 0, 1: 1, 2: 2, 3: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="policy-dashboard">
      <div className="dashboard-header">
        <h2 className="section-title">Your Policies</h2>
        <span className="policy-count">{policies.length} total</span>
      </div>
      <div className="policy-grid">
        {sorted.map((policy) => (
          <PolicyCard key={policy.policyId.toString()} policy={policy} />
        ))}
      </div>
    </div>
  );
}
