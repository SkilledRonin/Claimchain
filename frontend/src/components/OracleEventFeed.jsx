import { motion, AnimatePresence } from "framer-motion";

export default function OracleEventFeed({ eventLog }) {
  const events = (eventLog || []).slice(0, 10);

  return (
    <div className="glass-card oracle-feed-card">
      <div className="oracle-header">
        <div className="oracle-title-row">
          <span className="oracle-live-dot" />
          <h2 className="card-heading">Oracle Event Feed</h2>
        </div>
        {events.length > 0 && (
          <span className="event-count-badge">{events.length} events</span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="oracle-empty">
          <div className="oracle-empty-icon">📡</div>
          <p>Listening for on-chain events…</p>
          <p className="oracle-hint">Purchase a policy or trigger a payout to see live activity.</p>
        </div>
      ) : (
        <div className="oracle-events-list">
          <AnimatePresence initial={false}>
            {events.map((event, idx) => (
              <motion.div
                key={`${event.txHash}-${idx}`}
                className="oracle-event-row"
                style={{ "--event-clr": event.color }}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.03 }}
              >
                <span className="event-icon-circle" style={{ background: `${event.color}22`, color: event.color }}>
                  {event.icon}
                </span>
                <div className="event-text">
                  <span className="event-detail">{event.detail}</span>
                  <div className="event-meta-row">
                    <span className="event-type-tag" style={{ color: event.color }}>{event.type}</span>
                    <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    {event.txHash && (
                      <span className="event-hash mono" title={event.txHash}>
                        {event.txHash.slice(0, 10)}…
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
