import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useContract } from "./hooks/useContract";
import { usePolicies } from "./hooks/usePolicies";
import { CONTRACT_ADDRESS } from "./utils/constants";

import AnimatedBackground from "./components/AnimatedBackground";
import Navbar            from "./components/Navbar";
import HeroSection       from "./components/HeroSection";
import BuyPolicyCard     from "./components/BuyPolicyCard";
import PolicyList        from "./components/PolicyList";
import OwnerPanel        from "./components/OwnerPanel";
import OracleEventFeed   from "./components/OracleEventFeed";
import PayoutToast       from "./components/PayoutToast";

export default function App() {
  const { isConnected } = useAccount();
  const { userPolicyIds, refetchAll } = useContract();
  const { policies, isLoading, eventLog, refetch } = usePolicies(userPolicyIds);

  const [activeTab, setActiveTab] = useState("insure");
  const [toasts, setToasts]       = useState([]);

  function handlePolicyPurchased() {
    refetchAll();
    setTimeout(refetch, 2500);
  }

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isDeployed = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="app-shell">
      <AnimatedBackground />

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isConnected ? (
        <HeroSection />
      ) : (
        <main className="main-container">
          {!isDeployed && (
            <div className="deploy-warning">
              ⚠️ Contract not deployed. Run{" "}
              <code>npx hardhat run scripts/deploy.js --network localhost</code>{" "}
              then restart dev server.
            </div>
          )}

          {/* Tab: Insure */}
          {activeTab === "insure" && (
            <div className="two-col-grid">
              <div className="col-left">
                <BuyPolicyCard
                  onPolicyPurchased={handlePolicyPurchased}
                  onToast={addToast}
                />
                <OwnerPanel onTriggered={handlePolicyPurchased} />
              </div>
              <div className="col-right">
                <PolicyList policies={policies} isLoading={isLoading} />
              </div>
            </div>
          )}

          {/* Tab: My Policies */}
          {activeTab === "policies" && (
            <div className="single-col">
              <PolicyList policies={policies} isLoading={isLoading} />
            </div>
          )}

          {/* Tab: Events */}
          {activeTab === "events" && (
            <div className="single-col">
              <OracleEventFeed eventLog={eventLog} />
            </div>
          )}
        </main>
      )}

      <footer className="app-footer">
        <span>ClaimChain © 2025 — Parametric Insurance</span>
        <div className="footer-links">
          <a href="https://docs.chain.link/chainlink-functions" target="_blank" rel="noopener noreferrer">
            Chainlink Functions ↗
          </a>
          <a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer">
            Polygonscan ↗
          </a>
        </div>
      </footer>

      <PayoutToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
