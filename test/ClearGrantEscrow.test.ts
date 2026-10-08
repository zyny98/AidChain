import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ClearGrantEscrow, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ClearGrantEscrow Contract Tests", function () {
  let escrow: ClearGrantEscrow;
  let mockUsdc: MockUSDC;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let donor1: HardhatEthersSigner;
  let donor2: HardhatEthersSigner;
  let mallory: HardhatEthersSigner;

  const FUNDING_GOAL = ethers.parseUnits("1000", 6); // 1000 USDC
  const MILESTONE_1_AMOUNT = ethers.parseUnits("400", 6); // 400 USDC
  const MILESTONE_2_AMOUNT = ethers.parseUnits("400", 6); // 400 USDC (remaining 200 is 20% advance)

  beforeEach(async function () {
    [owner, organizer, oracle, donor1, donor2, mallory] = await ethers.getSigners();

    // 1. Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDCFactory.deploy(owner.address);
    await mockUsdc.waitForDeployment();

    // 2. Deploy ClearGrantEscrow
    const EscrowFactory = await ethers.getContractFactory("ClearGrantEscrow");
    escrow = await EscrowFactory.deploy(owner.address);
    await escrow.waitForDeployment();

    // 3. Fund donors with MockUSDC
    await mockUsdc.mint(donor1.address, ethers.parseUnits("10000", 6));
    await mockUsdc.mint(donor2.address, ethers.parseUnits("10000", 6));
  });

  describe("1. Campaign Creation", function () {
    it("should successfully create a campaign with milestones", async function () {
      const now = await time.latest();
      const deadlines = [now + 3600, now + 7200];
      const amounts = [MILESTONE_1_AMOUNT, MILESTONE_2_AMOUNT];

      const tx = await escrow.connect(organizer).createCampaign(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        amounts,
        deadlines
      );

      await expect(tx)
        .to.emit(escrow, "CampaignCreated")
        .withArgs(1, organizer.address, oracle.address, await mockUsdc.getAddress(), FUNDING_GOAL, 2);

      const campaign = await escrow.getCampaign(1);
      expect(campaign.organizer).to.equal(organizer.address);
      expect(campaign.oracle).to.equal(oracle.address);
      expect(campaign.fundingGoal).to.equal(FUNDING_GOAL);
      expect(campaign.active).to.be.true;
    });

    it("should revert if milestone array length mismatch", async function () {
      const now = await time.latest();
      await expect(
        escrow.connect(organizer).createCampaign(
          oracle.address,
          await mockUsdc.getAddress(),
          FUNDING_GOAL,
          [MILESTONE_1_AMOUNT],
          [now + 3600, now + 7200]
        )
      ).to.be.revertedWith("ClearGrant: arrays length mismatch");
    });
  });

  describe("2. Donations & Advance Release", function () {
    let campaignId: number;

    beforeEach(async function () {
      const now = await time.latest();
      const tx = await escrow.connect(organizer).createCampaign(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [MILESTONE_1_AMOUNT, MILESTONE_2_AMOUNT],
        [now + 3600, now + 7200]
      );
      campaignId = 1;

      // Approve escrow for donors
      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await mockUsdc.connect(donor2).approve(escrowAddr, ethers.MaxUint256);
    });

    it("should accept donations and track per-donor amounts", async function () {
      const donation1 = ethers.parseUnits("600", 6);
      const donation2 = ethers.parseUnits("400", 6);

      await expect(escrow.connect(donor1).donate(campaignId, donation1))
        .to.emit(escrow, "Donated")
        .withArgs(campaignId, donor1.address, donation1, donation1);

      await expect(escrow.connect(donor2).donate(campaignId, donation2))
        .to.emit(escrow, "Donated")
        .withArgs(campaignId, donor2.address, donation2, donation2);

      const campaign = await escrow.getCampaign(campaignId);
      expect(campaign.totalDeposited).to.equal(FUNDING_GOAL);
      expect(await escrow.getDonorDeposit(campaignId, donor1.address)).to.equal(donation1);
      expect(await escrow.getDonorDeposit(campaignId, donor2.address)).to.equal(donation2);
    });

    it("should allow organizer to release 20% advance when funding goal reached", async function () {
      await escrow.connect(donor1).donate(campaignId, FUNDING_GOAL);

      const orgBalanceBefore = await mockUsdc.balanceOf(organizer.address);
      const expectedAdvance = (FUNDING_GOAL * 2000n) / 10000n; // 200 USDC

      await expect(escrow.connect(organizer).releaseAdvance(campaignId))
        .to.emit(escrow, "AdvanceReleased")
        .withArgs(campaignId, organizer.address, expectedAdvance);

      const orgBalanceAfter = await mockUsdc.balanceOf(organizer.address);
      expect(orgBalanceAfter - orgBalanceBefore).to.equal(expectedAdvance);

      // Second attempt to release advance must revert
      await expect(
        escrow.connect(organizer).releaseAdvance(campaignId)
      ).to.be.revertedWith("ClearGrant: advance already released");
    });
  });

  describe("3. Milestone Report & Oracle Approval Pipeline", function () {
    let campaignId = 1;
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("fiscal_receipt_hash_1234567890"));

    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(organizer).createCampaign(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [MILESTONE_1_AMOUNT, MILESTONE_2_AMOUNT],
        [now + 3600, now + 7200]
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await escrow.connect(donor1).donate(campaignId, FUNDING_GOAL);
    });

    it("should allow organizer to submit report with SHA-256 hash", async function () {
      await expect(escrow.connect(organizer).submitReport(campaignId, 0, reportHash))
        .to.emit(escrow, "ReportSubmitted")
        .withArgs(campaignId, 0, reportHash);

      const milestone = await escrow.getMilestone(campaignId, 0);
      expect(milestone.status).to.equal(1); // Submitted
      expect(milestone.reportHash).to.equal(reportHash);
    });

    it("should approve milestone with valid oracle signature and release payout", async function () {
      // 1. Submit report
      await escrow.connect(organizer).submitReport(campaignId, 0, reportHash);

      // 2. Oracle generates ECDSA signature:
      // keccak256(abi.encodePacked(campaignId, milestoneIndex, reportHash, nonce))
      const nonce = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [campaignId, 0, reportHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));

      const orgBalanceBefore = await mockUsdc.balanceOf(organizer.address);

      // 3. Approve milestone
      await expect(escrow.approveMilestone(campaignId, 0, signature))
        .to.emit(escrow, "MilestoneApproved")
        .withArgs(campaignId, 0, MILESTONE_1_AMOUNT, nonce);

      const orgBalanceAfter = await mockUsdc.balanceOf(organizer.address);
      expect(orgBalanceAfter - orgBalanceBefore).to.equal(MILESTONE_1_AMOUNT);

      const milestone = await escrow.getMilestone(campaignId, 0);
      expect(milestone.status).to.equal(2); // Approved
    });

    it("should revert approval if forged/invalid oracle signature is used", async function () {
      await escrow.connect(organizer).submitReport(campaignId, 0, reportHash);

      const nonce = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [campaignId, 0, reportHash, nonce]
      );
      // Mallory signs instead of Oracle
      const fakeSignature = await mallory.signMessage(ethers.getBytes(messageHash));

      await expect(
        escrow.approveMilestone(campaignId, 0, fakeSignature)
      ).to.be.revertedWith("ClearGrant: invalid oracle signature");
    });

    it("should protect against replay attack with same signature", async function () {
      await escrow.connect(organizer).submitReport(campaignId, 0, reportHash);

      const nonce = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [campaignId, 0, reportHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));

      // First approval succeeds
      await escrow.approveMilestone(campaignId, 0, signature);

      // Replay attempt must revert because milestone is already Approved
      await expect(
        escrow.approveMilestone(campaignId, 0, signature)
      ).to.be.revertedWith("ClearGrant: milestone is not Submitted");
    });
  });

  describe("4. Milestone Rejection & Proportional Refund", function () {
    let campaignId = 1;
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("fraudulent_receipt"));
    const rejectHash = ethers.keccak256(ethers.toUtf8Bytes("reason: duplicate receipt detected"));

    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(organizer).createCampaign(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [MILESTONE_1_AMOUNT, MILESTONE_2_AMOUNT],
        [now + 3600, now + 7200]
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await mockUsdc.connect(donor2).approve(escrowAddr, ethers.MaxUint256);

      // Donor1: 60%, Donor2: 40%
      await escrow.connect(donor1).donate(campaignId, ethers.parseUnits("600", 6));
      await escrow.connect(donor2).donate(campaignId, ethers.parseUnits("400", 6));

      await escrow.connect(organizer).submitReport(campaignId, 0, reportHash);
    });

    it("should reject milestone upon oracle rejection and disable campaign", async function () {
      const nonce = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [campaignId, 0, reportHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));

      await expect(escrow.rejectMilestone(campaignId, 0, rejectHash, signature))
        .to.emit(escrow, "MilestoneRejected")
        .withArgs(campaignId, 0, rejectHash, nonce);

      const campaign = await escrow.getCampaign(campaignId);
      expect(campaign.active).to.be.false;
    });

    it("should proportionally refund remaining balance to multiple donors", async function () {
      const nonce = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [campaignId, 0, reportHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));
      await escrow.rejectMilestone(campaignId, 0, rejectHash, signature);

      const d1BalanceBefore = await mockUsdc.balanceOf(donor1.address);
      const d2BalanceBefore = await mockUsdc.balanceOf(donor2.address);

      // Refund donor1 (60% of 1000 = 600 USDC)
      await escrow.refund(campaignId, donor1.address);
      const d1BalanceAfter = await mockUsdc.balanceOf(donor1.address);
      expect(d1BalanceAfter - d1BalanceBefore).to.equal(ethers.parseUnits("600", 6));

      // Refund donor2 (40% of 1000 = 400 USDC)
      await escrow.refund(campaignId, donor2.address);
      const d2BalanceAfter = await mockUsdc.balanceOf(donor2.address);
      expect(d2BalanceAfter - d2BalanceBefore).to.equal(ethers.parseUnits("400", 6));

      // Double refund attempt must revert
      await expect(
        escrow.refund(campaignId, donor1.address)
      ).to.be.revertedWith("ClearGrant: no deposit found for donor");
    });
  });

  describe("5. Expire Milestone after Deadline", function () {
    it("should allow expiring a milestone after deadline and enable refunds", async function () {
      const now = await time.latest();
      await escrow.connect(organizer).createCampaign(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [MILESTONE_1_AMOUNT],
        [now + 100] // 100 seconds deadline
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await escrow.connect(donor1).donate(1, FUNDING_GOAL);

      // Advance time beyond deadline
      await time.increase(200);

      await expect(escrow.expireMilestone(1, 0))
        .to.emit(escrow, "MilestoneExpired")
        .withArgs(1, 0);

      const campaign = await escrow.getCampaign(1);
      expect(campaign.active).to.be.false;

      // Donor can now claim refund
      await expect(escrow.refund(1, donor1.address)).to.emit(escrow, "Refunded");
    });
  });
});
