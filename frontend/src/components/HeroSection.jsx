import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const CYCLING_TEXT = [
  "100% Trustless",
  "Powered by Chainlink",
  "Zero Human Intervention",
  "Instant Payouts",
];

export default function HeroSection() {
  const [textIdx, setTextIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTextIdx((i) => (i + 1) % CYCLING_TEXT.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      {/* Floating plane */}
      <div className="hero-plane" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path
            d="M8 32L56 8L44 32L56 56L8 32Z"
            fill="url(#planeGrad)"
          />
          <defs>
            <linearGradient id="planeGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/>
              <stop offset="1" stopColor="#60A5FA"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          Parametric Flight Insurance · On-Chain
        </div>

        <h1 className="hero-headline">
          Fly with confidence.<br />
          <span className="hero-gradient">Collect automatically.</span>
        </h1>

        <p className="hero-sub">
          Pay <strong>1 USDC</strong> to insure your flight. If it's delayed ≥ 2 hours,
          receive <strong>3 USDC</strong> automatically. Zero paperwork. Zero waiting.
        </p>

        <div className="hero-cycling">
          <span className={`cycling-text ${visible ? "cycling-in" : "cycling-out"}`}>
            ✦ {CYCLING_TEXT[textIdx]}
          </span>
        </div>

        <div className="hero-stats-row">
          <div className="hero-stat">
            <span className="hero-stat-num">3×</span>
            <span className="hero-stat-label">Payout Multiplier</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">0s</span>
            <span className="hero-stat-label">Claim Processing</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">100%</span>
            <span className="hero-stat-label">On-Chain Execution</span>
          </div>
        </div>

        <div className="hero-cta">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button className="hero-connect-btn" onClick={openConnectModal}>
                <span className="btn-glow" />
                Connect Wallet to Get Started
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{marginLeft:8}}>
                  <path d="M4 9H14M9 4L14 9L9 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </ConnectButton.Custom>
        </div>

        <p className="hero-disclaimer">
          🔒 Non-custodial · Powered by Chainlink · Deployed on Hardhat Testnet
        </p>
      </div>
    </section>
  );
}
