import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

/**
 * Hardhat localhost chain definition.
 * wagmi/viem don't ship this by default, so we define it manually.
 */
export const hardhatLocalhost = defineChain({
  id: 31337,
  name: "Hardhat Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
});

/**
 * Polygon Amoy testnet definition.
 */
export const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-amoy.polygon.technology"] },
  },
  blockExplorers: {
    default: { name: "Amoy PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
});

/**
 * Wagmi config used by RainbowKit + all hooks throughout the app.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "ClaimChain",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "claimchain_demo",
  chains: [hardhatLocalhost, polygonAmoy],
  ssr: false,
});
