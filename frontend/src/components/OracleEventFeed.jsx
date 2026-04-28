/**
 * OracleEventFeed — real-time log of ClaimChain contract events.
 * Populated by the usePolicies hook's event watcher.
 */
export default function OracleEventFeed({ eventLog }) {
  if (!eventLog || eventLog.length === 0) {
    return (
      <div className="oracle-feed card">
        <div className="oracle-feed-header">
          <h3 className="oracle-title">
            <span className="oracle-dot pulse" /> Oracle Event Feed
          </h3>
        </div>
        <div className="oracle-empty">
          <p>Listening for on-chain events…</p>
          <p className="oracle-hint">Purchase a policy or trigger a payout to see activity here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="oracle-feed card">
      <div className="oracle-feed-header">
        <h3 className="oracle-title">
          <span className="oracle-dot pulse" /> Oracle Event Feed
        </h3>
        <span className="oracle-count">{eventLog.length} events</span>
      </div>

      <div className="oracle-events">
        {eventLog.map((event, idx) => (
          <OracleEvent key={`${event.txHash}-${idx}`} event={event} />
        ))}
      </div>
    </div>
  );
}

function OracleEvent({ event }) {
  const timeStr = new Date(event.timestamp).toLocaleTimeString();

  return (
    <div className="oracle-event" style={{ "--event-color": event.color }}>
      <span className="event-icon">{event.icon}</span>
      <div className="event-body">
        <span className="event-detail">{event.detail}</span>
        <div className="event-meta">
          <span className="event-type" style={{ color: event.color }}>
            {event.type}
          </span>
          <span className="event-time">{timeStr}</span>
          {event.txHash && (
            <span className="event-hash" title={event.txHash}>
              {event.txHash.slice(0, 10)}…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
