import { motion, AnimatePresence } from "framer-motion";
import PolicyCard from "./PolicyCard";

export default function PolicyList({ policies, isLoading }) {
  if (isLoading) {
    return (
      <div className="glass-card policy-list-card">
        <div className="list-header">
          <h2 className="card-heading">My Policies</h2>
        </div>
        <div className="list-loading">
          <div className="chain-spinner" />
          <p>Fetching your policies…</p>
        </div>
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <div className="glass-card policy-list-card">
        <div className="list-header">
          <h2 className="card-heading">My Policies</h2>
        </div>
        <div className="list-empty">
          <div className="empty-plane">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
              <path d="M8 32L56 8L44 32L56 56L8 32Z" fill="url(#ep)" />
              <defs>
                <linearGradient id="ep" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#60A5FA"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="empty-title">No policies yet</p>
          <p className="empty-sub">Insure a flight to see your policies here.</p>
        </div>
      </div>
    );
  }

  const sorted = [...policies].sort((a, b) => {
    const order = { 0: 0, 1: 1, 2: 2, 3: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="glass-card policy-list-card">
      <div className="list-header">
        <h2 className="card-heading">My Policies</h2>
        <span className="policy-count-badge">{policies.length} total</span>
      </div>
      <div className="policy-scroll">
        <AnimatePresence>
          {sorted.map((policy) => (
            <motion.div
              key={policy.policyId.toString()}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <PolicyCard policy={policy} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
