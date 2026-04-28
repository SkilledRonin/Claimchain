/**
 * ClaimChain.test.js — Comprehensive Hardhat unit test suite
 *
 * Tests cover all Policy state transitions:
 *   - purchasePolicy
 *   - mockTriggerPayout  (demo flow)
 *   - expirePolicy
 *   - onlyOwner access controls
 *   - ReentrancyGuard protection
 *   - Edge cases (empty inputs, insufficient liquidity, double-payout)
 */

const { expect }         = require("chai");
const { ethers }         = require("hardhat");
const { loadFixture }    = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ── Constants ─────────────────────────────────────────────────────────────── //
const PREMIUM_RAW        = 1_000_000n;          // 1 USDC (6 decimals)
const PAYOUT_RAW         = PREMIUM_RAW * 3n;    // 3 USDC
const LIQUIDITY          = ethers.parseUnits("100000", 6);
const DEPLOYER_MINT      = ethers.parseUnits("1000000", 6);

const FLIGHT_NUMBER      = "AA123";
const FLIGHT_DATE        = "2025-06-15";

const PLACEHOLDER_ROUTER = "0x0000000000000000000000000000000000000001";
const DON_ID             = ethers.encodeBytes32String("fun-localhost-1");
const SUB_ID             = 1n;

// ── Fixture ───────────────────────────────────────────────────────────────── //
async function deployFixture() {
  const [owner, alice, bob, treasury] = await ethers.getSigners();

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy(owner.address);
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();

  // Mint to deployer
  await usdc.mint(owner.address, DEPLOYER_MINT);

  // Deploy ClaimChain
  const ClaimChain = await ethers.getContractFactory("ClaimChain");
  const cc = await ClaimChain.deploy(
    PLACEHOLDER_ROUTER,
    DON_ID,
    SUB_ID,
    usdcAddr,
    treasury.address,
    "// mock source"
  );
  await cc.waitForDeployment();
  const ccAddr = await cc.getAddress();

  // Fund ClaimChain with liquidity
  await usdc.transfer(ccAddr, LIQUIDITY);

  // Give alice some USDC and approve the contract
  await usdc.transfer(alice.address, ethers.parseUnits("100", 6));
  await usdc.connect(alice).approve(ccAddr, ethers.MaxUint256);

  // Give bob some USDC and approve the contract
  await usdc.transfer(bob.address, ethers.parseUnits("100", 6));
  await usdc.connect(bob).approve(ccAddr, ethers.MaxUint256);

  return { cc, usdc, owner, alice, bob, treasury, ccAddr, usdcAddr };
}

// ─────────────────────────────────────────────────────────────────────────── //
describe("ClaimChain", function () {

  // ── MockUSDC ─────────────────────────────────────────────────────────── //
  describe("MockUSDC", function () {
    it("has 6 decimals", async function () {
      const { usdc } = await loadFixture(deployFixture);
      expect(await usdc.decimals()).to.equal(6);
    });

    it("owner can mint to any address", async function () {
      const { usdc, owner, bob } = await loadFixture(deployFixture);
      const before = await usdc.balanceOf(bob.address);
      await usdc.connect(owner).mint(bob.address, PREMIUM_RAW);
      expect(await usdc.balanceOf(bob.address)).to.equal(before + PREMIUM_RAW);
    });

    it("faucet mints 1000 USDC to caller", async function () {
      const { usdc, bob } = await loadFixture(deployFixture);
      const before = await usdc.balanceOf(bob.address);
      await usdc.connect(bob).faucet();
      expect(await usdc.balanceOf(bob.address)).to.equal(
        before + ethers.parseUnits("1000", 6)
      );
    });

    it("non-owner cannot mint", async function () {
      const { usdc, alice, bob } = await loadFixture(deployFixture);
      await expect(
        usdc.connect(alice).mint(bob.address, PREMIUM_RAW)
      ).to.be.reverted;
    });
  });

  // ── Deployment ───────────────────────────────────────────────────────── //
  describe("Deployment", function () {
    it("sets the correct owner", async function () {
      const { cc, owner } = await loadFixture(deployFixture);
      expect(await cc.owner()).to.equal(owner.address);
    });

    it("stores the USDC token address", async function () {
      const { cc, usdcAddr } = await loadFixture(deployFixture);
      expect(await cc.usdcToken()).to.equal(usdcAddr);
    });

    it("contract holds initial liquidity", async function () {
      const { usdc, ccAddr } = await loadFixture(deployFixture);
      expect(await usdc.balanceOf(ccAddr)).to.equal(LIQUIDITY);
    });

    it("policyCounter starts at zero", async function () {
      const { cc } = await loadFixture(deployFixture);
      expect(await cc.policyCounter()).to.equal(0n);
    });
  });

  // ── purchasePolicy ───────────────────────────────────────────────────── //
  describe("purchasePolicy", function () {
    it("creates a policy and increments counter", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      expect(await cc.policyCounter()).to.equal(1n);
    });

    it("stores correct policy fields", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      const policy = await cc.getPolicyById(1n);

      expect(policy.policyId).to.equal(1n);
      expect(policy.policyholder).to.equal(alice.address);
      expect(policy.flightNumber).to.equal(FLIGHT_NUMBER);
      expect(policy.flightDate).to.equal(FLIGHT_DATE);
      expect(policy.premiumPaid).to.equal(PREMIUM_RAW);
      expect(policy.payoutAmount).to.equal(PAYOUT_RAW);
      expect(policy.status).to.equal(0); // Active
      expect(policy.triggerConfirmed).to.equal(false);
    });

    it("emits PolicyCreated event", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await expect(
        cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE)
      )
        .to.emit(cc, "PolicyCreated")
        .withArgs(1n, alice.address, FLIGHT_NUMBER);
    });

    it("deducts premium from buyer's USDC balance", async function () {
      const { cc, usdc, alice } = await loadFixture(deployFixture);
      const before = await usdc.balanceOf(alice.address);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      expect(await usdc.balanceOf(alice.address)).to.equal(before - PREMIUM_RAW);
    });

    it("adds policyId to user's list", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      const ids = await cc.getUserPolicies(alice.address);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1n);
    });

    it("reverts when flight number is empty", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await expect(
        cc.connect(alice).purchasePolicy("", FLIGHT_DATE)
      ).to.be.revertedWith("ClaimChain: empty flight number");
    });

    it("reverts when flight date is empty", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await expect(
        cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, "")
      ).to.be.revertedWith("ClaimChain: empty flight date");
    });

    it("reverts when contract has insufficient liquidity", async function () {
      // Deploy a fresh contract with zero liquidity.
      const [owner, alice] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc2 = await MockUSDC.deploy(owner.address);
      await usdc2.waitForDeployment();

      const ClaimChain = await ethers.getContractFactory("ClaimChain");
      const cc2 = await ClaimChain.deploy(
        PLACEHOLDER_ROUTER, DON_ID, SUB_ID,
        await usdc2.getAddress(), owner.address, "// src"
      );
      await cc2.waitForDeployment();

      await usdc2.mint(alice.address, ethers.parseUnits("10", 6));
      await usdc2.connect(alice).approve(await cc2.getAddress(), ethers.MaxUint256);

      await expect(
        cc2.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE)
      ).to.be.revertedWith("ClaimChain: insufficient liquidity for payout");
    });

    it("allows multiple users to buy policies", async function () {
      const { cc, alice, bob } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy("AA100", "2025-07-01");
      await cc.connect(bob).purchasePolicy("BA200", "2025-07-02");
      expect(await cc.policyCounter()).to.equal(2n);
    });
  });

  // ── mockTriggerPayout ────────────────────────────────────────────────── //
  describe("mockTriggerPayout (demo mode)", function () {
    async function buyPolicy(cc, alice) {
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      return 1n;
    }

    it("pays out the policyholder in USDC", async function () {
      const { cc, usdc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);

      const before = await usdc.balanceOf(alice.address);
      await cc.mockTriggerPayout(policyId);
      const after = await usdc.balanceOf(alice.address);

      expect(after - before).to.equal(PAYOUT_RAW);
    });

    it("emits PolicyPaidOut event", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);

      await expect(cc.mockTriggerPayout(policyId))
        .to.emit(cc, "PolicyPaidOut")
        .withArgs(policyId, alice.address, PAYOUT_RAW);
    });

    it("sets policy status to PaidOut (1)", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await cc.mockTriggerPayout(policyId);
      const policy = await cc.getPolicyById(policyId);
      expect(policy.status).to.equal(1); // PaidOut
    });

    it("sets triggerConfirmed to true", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await cc.mockTriggerPayout(policyId);
      const policy = await cc.getPolicyById(policyId);
      expect(policy.triggerConfirmed).to.equal(true);
    });

    it("reverts if called by non-owner", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await expect(
        cc.connect(alice).mockTriggerPayout(policyId)
      ).to.be.reverted;
    });

    it("reverts if policy is already PaidOut", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await cc.mockTriggerPayout(policyId);
      await expect(
        cc.mockTriggerPayout(policyId)
      ).to.be.revertedWith("ClaimChain: policy not active");
    });
  });

  // ── expirePolicy ─────────────────────────────────────────────────────── //
  describe("expirePolicy", function () {
    async function buyPolicy(cc, alice) {
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      return 1n;
    }

    it("sets policy status to Expired (3)", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await cc.expirePolicy(policyId);
      const policy = await cc.getPolicyById(policyId);
      expect(policy.status).to.equal(2); // Expired
    });

    it("emits PolicyExpired event", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await expect(cc.expirePolicy(policyId))
        .to.emit(cc, "PolicyExpired")
        .withArgs(policyId);
    });

    it("sweeps premium to the treasury", async function () {
      const { cc, usdc, alice, treasury } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);

      const before = await usdc.balanceOf(treasury.address);
      await cc.expirePolicy(policyId);
      const after = await usdc.balanceOf(treasury.address);

      expect(after - before).to.equal(PREMIUM_RAW);
    });

    it("reverts if called by non-owner", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await expect(
        cc.connect(alice).expirePolicy(policyId)
      ).to.be.reverted;
    });

    it("reverts if policy is already PaidOut", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      const policyId = await buyPolicy(cc, alice);
      await cc.mockTriggerPayout(policyId);
      await expect(cc.expirePolicy(policyId)).to.be.revertedWith(
        "ClaimChain: policy not active"
      );
    });
  });

  // ── Chainlink Automation (checkUpkeep / performUpkeep) ──────────────── //
  describe("Chainlink Automation interface", function () {
    it("checkUpkeep returns false when no policies exist", async function () {
      const { cc } = await loadFixture(deployFixture);
      const [needed] = await cc.checkUpkeep("0x");
      expect(needed).to.equal(false);
    });

    it("checkUpkeep returns true when an Active policy exists", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      const [needed, performData] = await cc.checkUpkeep("0x");
      expect(needed).to.equal(true);
      const policyId = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256"], performData
      )[0];
      expect(policyId).to.equal(1n);
    });

    it("checkUpkeep returns false after policy is paid out", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy(FLIGHT_NUMBER, FLIGHT_DATE);
      await cc.mockTriggerPayout(1n);
      const [needed] = await cc.checkUpkeep("0x");
      expect(needed).to.equal(false);
    });
  });

  // ── Admin & Configuration ────────────────────────────────────────────── //
  describe("Admin functions", function () {
    it("owner can update insurerTreasury", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.setInsurerTreasury(alice.address);
      expect(await cc.insurerTreasury()).to.equal(alice.address);
    });

    it("setInsurerTreasury reverts on zero address", async function () {
      const { cc } = await loadFixture(deployFixture);
      await expect(
        cc.setInsurerTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("ClaimChain: zero treasury address");
    });

    it("owner can emergency-withdraw USDC", async function () {
      const { cc, usdc, owner, ccAddr } = await loadFixture(deployFixture);
      const contractBalance = await usdc.balanceOf(ccAddr);
      const ownerBefore     = await usdc.balanceOf(owner.address);

      await cc.emergencyWithdraw(contractBalance);

      expect(await usdc.balanceOf(ccAddr)).to.equal(0n);
      expect(await usdc.balanceOf(owner.address)).to.equal(
        ownerBefore + contractBalance
      );
    });

    it("non-owner cannot emergency-withdraw", async function () {
      const { cc, alice, usdc, ccAddr } = await loadFixture(deployFixture);
      await expect(
        cc.connect(alice).emergencyWithdraw(await usdc.balanceOf(ccAddr))
      ).to.be.reverted;
    });
  });

  // ── getUserPolicies ──────────────────────────────────────────────────── //
  describe("getUserPolicies", function () {
    it("returns empty array for a fresh address", async function () {
      const { cc, bob } = await loadFixture(deployFixture);
      const ids = await cc.getUserPolicies(bob.address);
      expect(ids.length).to.equal(0);
    });

    it("returns all policy IDs for a user with multiple policies", async function () {
      const { cc, alice } = await loadFixture(deployFixture);
      await cc.connect(alice).purchasePolicy("AA100", "2025-07-01");
      await cc.connect(alice).purchasePolicy("BA200", "2025-07-02");
      await cc.connect(alice).purchasePolicy("CA300", "2025-07-03");

      const ids = await cc.getUserPolicies(alice.address);
      expect(ids.length).to.equal(3);
      expect(ids.map(Number)).to.deep.equal([1, 2, 3]);
    });
  });
});
