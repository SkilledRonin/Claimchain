import { useState, useEffect, useRef } from "react";
import { useContract } from "../hooks/useContract";

function useCountUp(target, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(+(start + diff * ease).toFixed(2));
      if (t < 1) requestAnimationFrame(step);
      else { prev.current = target; setDisplay(target); }
    }
    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

export default function UsdcBalance() {
  const { usdcBalance, claimFaucet, isWritePending, userAddress } = useContract();
  const [glowing, setGlowing] = useState(false);
  const prevBalance = useRef(null);

  const balanceNum = userAddress ? +(Number(usdcBalance) / 1_000_000).toFixed(2) : 0;
  const displayed = useCountUp(balanceNum);

  useEffect(() => {
    if (prevBalance.current !== null && prevBalance.current !== balanceNum) {
      setGlowing(true);
      const t = setTimeout(() => setGlowing(false), 1800);
      return () => clearTimeout(t);
    }
    prevBalance.current = balanceNum;
  }, [balanceNum]);

  if (!userAddress) return null;

  return (
    <div className={`usdc-badge-new ${glowing ? "usdc-glow" : ""}`}>
      <span className="usdc-icon">💵</span>
      <span className="usdc-num">{displayed.toFixed(2)}</span>
      <span className="usdc-label">USDC</span>
      <button
        className="faucet-btn-new"
        onClick={claimFaucet}
        disabled={isWritePending}
        title="Claim 1,000 test USDC"
      >
        Faucet
      </button>
    </div>
  );
}
