# ClaimChain ⛓️

> **Parametric flight-delay micro-insurance on the blockchain.**  
> Pay a 1 USDC premium. If your flight is delayed ≥ 2 hours, receive 3 USDC automatically — zero human intervention, zero claims process.

---

## How It Works

```
User pays 1 USDC premium
       │
       ▼
ClaimChain smart contract locks funds + creates Policy
       │
       ▼
Chainlink Automation polls flight status every N minutes
       │
       ▼
Chainlink Functions fetches AviationStack API
       │
  delay ≥ 120 min?
       │
  YES ─┼──► _executePayout() sends 3 USDC to policyholder instantly
       │
  NO ──┼──► TriggerNotMet event, policy remains Active
```

---

## Project Structure

```
claimchain/
├── contracts/
│   ├── ClaimChain.sol          # Core insurance logic
│   ├── MockUSDC.sol            # Test ERC-20 (6 decimals)
│   └── interfaces/
│       └── IClaimChain.sol     # Shared interface & types
├── scripts/
│   ├── deploy.js               # Deploy + fund contracts
│   └── verify.js               # Polygonscan verification
├── test/
│   └── ClaimChain.test.js      # Full Hardhat test suite
├── chainlink/
│   └── flightStatusSource.js   # Chainlink Functions JS source
├── frontend/
│   └── src/
│       ├── components/         # React UI components
│       ├── hooks/              # wagmi contract hooks
│       ├── utils/              # ABI, constants, wagmi config
│       ├── App.jsx
│       └── main.jsx
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MetaMask | Latest browser extension |
| Git | Any |

---

## 🚀 Localhost Demo — Step by Step

### 1 — Clone & Install Root Dependencies

```bash
git clone <your-repo-url>
cd claimchain
npm install
```

### 2 — Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3 — Set Up Environment Variables

```bash
cp .env.example .env
# No changes needed for localhost demo — defaults work out of the box
```

### 4 — Start the Local Hardhat Blockchain

Open a **dedicated terminal** and keep it running:

```bash
npx hardhat node
```

You will see 20 test accounts printed with their private keys. **Copy the private key of Account #0** — you'll import it into MetaMask.

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 5 — Deploy Contracts Locally

In a **second terminal**:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This will:
- Deploy **MockUSDC** and mint 1,000,000 USDC to the deployer
- Deploy **ClaimChain** contract
- Fund it with **100,000 USDC** liquidity
- Auto-write deployed addresses to `frontend/src/utils/constants.js`

Expected output:
```
✅  Deployment complete!
┌─────────────────────────────────────────────────────────────┐
│ Network        : localhost                                   │
│ MockUSDC       : 0x5FbDB2315678afecb367f032d93F642f64180aa3 │
│ ClaimChain     : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 │
└─────────────────────────────────────────────────────────────┘
```

### 6 — Run the Frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🦊 MetaMask Setup for Local Demo

### Import the Hardhat Test Account

1. Open MetaMask → Click account avatar → **Import Account**
2. Paste the private key from Account #0:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click **Import**

### Add Hardhat Localhost Network

1. MetaMask → Settings → Networks → **Add Network**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | Network Name | Hardhat Localhost |
   | RPC URL | http://127.0.0.1:8545 |
   | Chain ID | 31337 |
   | Currency Symbol | ETH |
3. Click **Save** and switch to this network

---

## 🎬 Demo Walkthrough

### Step 1 — Connect Wallet
Click **"Connect Wallet"** in the top-right corner and select MetaMask.

### Step 2 — Get Test USDC
Click the **"Faucet"** button next to your balance to claim 1,000 test USDC.

### Step 3 — Purchase a Policy
1. Enter a flight number (e.g., `AA123`)
2. Enter a flight date
3. Click **"Approve USDC & Purchase"**
4. Approve both MetaMask transactions (USDC approval + policy purchase)
5. Your new policy appears in the dashboard with **Active** status

### Step 4 — Trigger Payout (Demo Mode)
The owner wallet sees the **"Demo Mode — Owner Only"** panel:
1. Enter the **Policy ID** (e.g., `1`)
2. Click **"⚡ Simulate Delay & Trigger Payout"**
3. Confirm the MetaMask transaction
4. Watch the policy flip to **Paid Out** and your USDC balance increase by **3 USDC**
5. The Oracle Event Feed shows the `PolicyPaidOut` event in real time

---

## 🧪 Running Tests

```bash
npx hardhat test
```

For gas report:
```bash
REPORT_GAS=true npx hardhat test
```

For coverage:
```bash
npx hardhat coverage
```

The test suite covers:
- MockUSDC deployment and faucet
- Policy creation, field validation, insufficient liquidity
- `mockTriggerPayout` success, access control, double-payout protection  
- `expirePolicy` treasury sweep and access control
- Chainlink Automation `checkUpkeep` / `performUpkeep` interface
- Admin configuration functions

---

## 🌐 Polygon Amoy Testnet Deployment

### Prerequisites
1. Get MATIC from the [Amoy faucet](https://faucet.polygon.technology/)
2. Create a [Chainlink Functions subscription](https://functions.chain.link/) on Amoy
3. Add your AviationStack API key to the Chainlink subscription as a secret: `aviationKey`
4. Fund your subscription with at least 5 LINK

### Configure `.env`

```env
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=<your-deployer-private-key>
CHAINLINK_SUBSCRIPTION_ID=<your-subscription-id>
CHAINLINK_DON_ID=fun-polygon-amoy-1
POLYGONSCAN_API_KEY=<your-polygonscan-api-key>
```

### Deploy to Amoy

```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

### Verify Contracts

```bash
npx hardhat run scripts/verify.js --network polygonAmoy
```

### Add Contract as Chainlink Automation Upkeep
1. Go to [automation.chain.link](https://automation.chain.link/)
2. Register a new **Custom Logic** upkeep
3. Enter the deployed `ClaimChain` contract address
4. Fund with LINK

---

## 🔐 Security Notes

- `mockTriggerPayout` is **owner-only** — gated both on-chain (`onlyOwner`) and in the UI (address comparison)
- `ReentrancyGuard` protects all fund-movement functions
- `SafeERC20` is used for all USDC transfers
- No private keys are ever hardcoded
- USDC amounts always handled in 6-decimal raw units (1 USDC = 1,000,000)

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LOCAL_RPC_URL` | No | Hardhat node URL (default: `http://127.0.0.1:8545`) |
| `POLYGON_AMOY_RPC_URL` | Amoy only | RPC endpoint for Polygon Amoy |
| `PRIVATE_KEY` | Amoy only | Deployer wallet private key |
| `CHAINLINK_SUBSCRIPTION_ID` | Amoy only | Chainlink Functions subscription ID |
| `CHAINLINK_DON_ID` | Amoy only | DON ID (default: `fun-polygon-amoy-1`) |
| `AVIATIONSTACK_API_KEY` | Amoy only | AviationStack API key (stored as Chainlink secret) |
| `POLYGONSCAN_API_KEY` | Optional | For contract verification |
| `VITE_CONTRACT_ADDRESS` | Auto-set | Written by deploy.js |
| `VITE_USDC_ADDRESS` | Auto-set | Written by deploy.js |
| `VITE_CHAIN_ID` | Auto-set | Written by deploy.js |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.19, OpenZeppelin 5, Chainlink Contracts |
| Development | Hardhat, Ethers.js v6 |
| Oracle | Chainlink Functions (AviationStack API) |
| Automation | Chainlink Automation (Keepers) |
| Frontend | React 18, Vite, wagmi v2, RainbowKit, TanStack Query |
| Network | Polygon Amoy Testnet / Hardhat Localhost |

---

## License

MIT
