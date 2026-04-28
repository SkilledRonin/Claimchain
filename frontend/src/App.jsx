import { useAccount } from "wagmi";
import { useContract } from "./hooks/useContract";
import { usePolicies } from "./hooks/usePolicies";
import ConnectWallet from "./components/ConnectWallet";
import PolicyForm from "./components/PolicyForm";
import PolicyDashboard from "./components/PolicyDashboard";
import OracleEventFeed from "./components/OracleEventFeed";
import MockTriggerToggle from "./components/MockTriggerToggle";
import { CONTRACT_ADDRESS } from "./utils/constants";

export default function App() {
  const { isConnected } = useAccount();
  const { userPolicyIds, refetchAll } = useContract();
  const { policies, isLoading, eventLog, refetch } = usePolicies(userPolicyIds);

  function handlePolicyPurchased() {
    refetchAll();
    setTimeout(refetch, 2500); // slight delay to let the chain mine
  }

  const isDeployed =
    CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="app">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <span className="logo-icon">⛓️</span>
            <span className="logo-text">Claim<span className="logo-accent">Chain</span></span>
            <span className="logo-tag">Testnet</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Powered by Chainlink · Built on Polygon</div>
          <h1 className="hero-title">
            Instant, Trustless<br />
            <span className="gradient-text">Flight Insurance</span>
          </h1>
          <p className="hero-sub">
            Purchase a parametric policy in seconds. If your flight is delayed
            by 2+ hours, our smart contract <strong>automatically</strong> pays
            you — no claims, no adjusters, no waiting.
          </p>
          <div className="hero-stats">
            <div className="stat-pill">
              <span className="stat-num">3×</span>
              <span className="stat-label">Payout Multiplier</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">0s</span>
              <span className="stat-label">Claim Processing Time</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">100%</span>
              <span className="stat-label">On-Chain Execution</span>
            </div>
          </div>
        </div>
        <div className="hero-bg-glow" />
      </section>

      {/* ── Deployment Warning ────────────────────────────────────────── */}
      {!isDeployed && (
        <div className="container">
          <div className="alert alert-warning">
            ⚠️ Contract not yet deployed. Run{" "}
            <code>npx hardhat run scripts/deploy.js --network localhost</code> then
            restart the dev server.
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content container">
        {!isConnected ? (
          <div className="not-connected">
            <div className="not-connected-icon">🔗</div>
            <h2>Connect Your Wallet</h2>
            <p>
              Connect MetaMask (or any injected wallet) to the Hardhat Localhost
              network to purchase a policy and view your dashboard.
            </p>
            <div className="nc-steps">
              <div className="nc-step">
                <span className="nc-step-num">1</span>
                <span>Open MetaMask → Import Hardhat account using private key</span>
              </div>
              <div className="nc-step">
                <span className="nc-step-num">2</span>
                <span>Switch to Hardhat Localhost (chain ID 31337)</span>
              </div>
              <div className="nc-step">
                <span className="nc-step-num">3</span>
                <span>Click "Connect Wallet" above</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="two-col-layout">
            {/* Left column */}
            <div className="left-col">
              <PolicyForm onPolicyPurchased={handlePolicyPurchased} />
              <MockTriggerToggle onTriggered={handlePolicyPurchased} />
            </div>

            {/* Right column */}
            <div className="right-col">
              <PolicyDashboard policies={policies} isLoading={isLoading} />
              <OracleEventFeed eventLog={eventLog} />
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <span>ClaimChain © 2025 — Parametric Insurance on Polygon</span>
          <div className="footer-links">
            <a
              href="https://docs.chain.link/chainlink-functions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chainlink Functions ↗
            </a>
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Polygonscan ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
