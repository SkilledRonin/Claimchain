import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PayoutToast({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === "success";
  const isPayout = toast.type === "payout";

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, y: 48, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <span className="toast-icon">
        {isPayout ? "💸" : isSuccess ? "✅" : "⚠️"}
      </span>
      <div className="toast-body">
        <span className="toast-title">{toast.title}</span>
        {toast.subtitle && <span className="toast-sub">{toast.subtitle}</span>}
      </div>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>✕</button>
    </motion.div>
  );
}
