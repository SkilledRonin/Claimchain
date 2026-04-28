/**
 * verify.js — Verify ClaimChain contracts on Polygonscan (Amoy)
 *
 * Usage:
 *   npx hardhat run scripts/verify.js --network polygonAmoy
 *
 * Reads addresses from frontend/src/utils/constants.js that was written
 * by deploy.js. Set POLYGONSCAN_API_KEY in your .env file.
 */

const { run } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// Dynamically read the auto-generated constants so addresses stay in sync.
function readConstants() {
  const constantsPath = path.resolve(
    __dirname,
    "../frontend/src/utils/constants.js"
  );
  if (!fs.existsSync(constantsPath)) {
    throw new Error(
      "constants.js not found. Run deploy.js first:\n" +
      "  npx hardhat run scripts/deploy.js --network polygonAmoy"
    );
  }

  const source = fs.readFileSync(constantsPath, "utf8");

  const usdcMatch     = source.match(/USDC_ADDRESS\s*=\s*"(0x[0-9a-fA-F]{40})"/);
  const contractMatch = source.match(/CONTRACT_ADDRESS\s*=\s*"(0x[0-9a-fA-F]{40})"/);

  if (!usdcMatch || !contractMatch) {
    throw new Error("Could not parse addresses from constants.js");
  }

  return {
    usdcAddress:     usdcMatch[1],
    contractAddress: contractMatch[1],
  };
}

async function main() {
  const { usdcAddress, contractAddress } = readConstants();

  const [deployer] = await ethers.getSigners();

  console.log("\n🔍 Verifying contracts on Polygonscan (Amoy)...\n");

  // ── Verify MockUSDC ──────────────────────────────────────────────────── //
  console.log(`Verifying MockUSDC at ${usdcAddress} ...`);
  try {
    await run("verify:verify", {
      address:              usdcAddress,
      constructorArguments: [deployer.address],
    });
    console.log("  ✔ MockUSDC verified\n");
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("  ℹ MockUSDC already verified\n");
    } else {
      console.error("  ✖ MockUSDC verification failed:", err.message, "\n");
    }
  }

  // ── Verify ClaimChain ─────────────────────────────────────────────────── //
  const { ethers, network } = require("hardhat");
  const fs2 = require("fs");
  const path2 = require("path");

  const flightSource = fs2.readFileSync(
    path2.resolve(__dirname, "../chainlink/flightStatusSource.js"),
    "utf8"
  );

  const donId = ethers.encodeBytes32String(
    process.env.CHAINLINK_DON_ID || "fun-polygon-amoy-1"
  );
  const subscriptionId = BigInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "0");
  const router = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";

  console.log(`Verifying ClaimChain at ${contractAddress} ...`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        router,
        donId,
        subscriptionId,
        usdcAddress,
        deployer.address,
        flightSource,
      ],
    });
    console.log("  ✔ ClaimChain verified\n");
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("  ℹ ClaimChain already verified\n");
    } else {
      console.error("  ✖ ClaimChain verification failed:", err.message, "\n");
    }
  }

  console.log("✅ Verification run complete.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
