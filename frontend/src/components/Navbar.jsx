import { useState, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useContract } from "../hooks/useContract";
import UsdcBalance from "./UsdcBalance";

export default function Navbar({ activeTab, setActiveTab }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const tabs = [
    { id: "insure", label: "Insure" },
    { id: "policies", label: "My Policies" },
    { id: "events", label: "Events" },
  ];

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="navbar-glass" ref={menuRef}>
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="9" r="5" stroke="#A855F7" strokeWidth="2.5"/>
            <circle cx="19" cy="19" r="5" stroke="#60A5FA" strokeWidth="2.5"/>
            <line x1="13" y1="13" x2="15" y2="15" stroke="#A855F7" strokeWidth="2"/>
          </svg>
          <span className="navbar-wordmark">
            Claim<span className="accent">Chain</span>
          </span>
          <span className="navbar-testnet-badge">TESTNET</span>
        </div>

        {/* Nav Pills — desktop */}
        <nav className="navbar-pills">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`nav-pill ${activeTab === t.id ? "nav-pill-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right: balance + connect */}
        <div className="navbar-right">
          <UsdcBalance />
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>

        {/* Hamburger — mobile */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className={`hb-line ${menuOpen ? "hb-open" : ""}`} />
          <span className={`hb-line ${menuOpen ? "hb-open" : ""}`} />
          <span className={`hb-line ${menuOpen ? "hb-open" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-drawer">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`drawer-item ${activeTab === t.id ? "drawer-item-active" : ""}`}
              onClick={() => { setActiveTab(t.id); setMenuOpen(false); }}
            >
              {t.label}
            </button>
          ))}
          <div className="drawer-wallet">
            <UsdcBalance />
            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        </div>
      )}
    </header>
  );
}
