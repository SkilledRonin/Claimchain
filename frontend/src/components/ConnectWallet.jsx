import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useContract } from "../hooks/useContract";

/**
 * ConnectWallet — top-right wallet button with USDC balance badge.
 * Uses RainbowKit's ConnectButton with a custom render for the extra balance chip.
 */
export default function ConnectWallet() {
  const { usdcBalance, claimFaucet, isWritePending, userAddress } = useContract();

  const formattedBalance = userAddress
    ? (Number(usdcBalance) / 1_000_000).toFixed(2)
    : "0.00";

  return (
    <div className="connect-wallet-wrapper">
      {userAddress && (
        <div className="usdc-badge" title={`${formattedBalance} USDC available`}>
          <span className="usdc-dot" />
          <span className="usdc-amount">{formattedBalance} USDC</span>
          <button
            className="faucet-btn"
            onClick={claimFaucet}
            disabled={isWritePending}
            title="Claim 1,000 test USDC from faucet"
          >
            Faucet
          </button>
        </div>
      )}
      <ConnectButton
        accountStatus="avatar"
        chainStatus="icon"
        showBalance={false}
      />
    </div>
  );
}
