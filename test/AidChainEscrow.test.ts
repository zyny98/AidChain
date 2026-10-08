import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AidChainEscrow, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AIDCHAIN — Proof of Aid Escrow Contract Tests", function () {
  let escrow: AidChainEscrow;
  let mockUsdc: MockUSDC;
  let owner: HardhatEthersSigner;
  let ngo: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let donor1: HardhatEthersSigner;
  let donor2: HardhatEthersSigner;

  const FUNDING_GOAL = ethers.parseUnits("10000", 6); // 10,000 USDC
  const STAGE_PROCUREMENT_AMOUNT = ethers.parseUnits("4000", 6); // 4,000 USDC for Supplier procurement
  const STAGE_DISTRIBUTION_AMOUNT = ethers.parseUnits("4000", 6); // 4,000 USDC for Distribution to camps
  // 2,000 USDC is 20% advance for logistics setup

  beforeEach(async function () {
    [owner, ngo, oracle, donor1, donor2] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDCFactory.deploy(owner.address);
    await mockUsdc.waitForDeployment();

    const EscrowFactory = await ethers.getContractFactory("AidChainEscrow");
    escrow = await EscrowFactory.deploy(owner.address);
    await escrow.waitForDeployment();

    await mockUsdc.mint(donor1.address, ethers.parseUnits("50000", 6));
    await mockUsdc.mint(donor2.address, ethers.parseUnits("50000", 6));
  });

  describe("1. Aid Program Creation (Supply Chain Setup)", function () {
    it("should create an aid program with Procurement, Distribution & Reporting stages", async function () {
      const now = await time.latest();
      const deadlines = [now + 86400, now + 172800];
      const amounts = [STAGE_PROCUREMENT_AMOUNT, STAGE_DISTRIBUTION_AMOUNT];
      const stages = [0, 1]; // Procurement (0), Distribution (1)

      const tx = await escrow.connect(ngo).createAidProgram(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        amounts,
        deadlines,
        stages
      );

      await expect(tx)
        .to.emit(escrow, "AidProgramCreated")
        .withArgs(1, ngo.address, oracle.address, await mockUsdc.getAddress(), FUNDING_GOAL, 2);

      const program = await escrow.getAidProgram(1);
      expect(program.ngo).to.equal(ngo.address);
      expect(program.oracle).to.equal(oracle.address);
      expect(program.fundingGoal).to.equal(FUNDING_GOAL);
      expect(program.active).to.be.true;
    });
  });

  describe("2. Donations & Advance Release", function () {
    let programId = 1;

    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(ngo).createAidProgram(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [STAGE_PROCUREMENT_AMOUNT, STAGE_DISTRIBUTION_AMOUNT],
        [now + 86400, now + 172800],
        [0, 1]
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await mockUsdc.connect(donor2).approve(escrowAddr, ethers.MaxUint256);
    });

    it("should accept donations and track donor deposits", async function () {
      const d1 = ethers.parseUnits("6000", 6);
      const d2 = ethers.parseUnits("4000", 6);

      await expect(escrow.connect(donor1).donate(programId, d1))
        .to.emit(escrow, "Donated")
        .withArgs(programId, donor1.address, d1, d1);

      await expect(escrow.connect(donor2).donate(programId, d2))
        .to.emit(escrow, "Donated")
        .withArgs(programId, donor2.address, d2, d2);

      const program = await escrow.getAidProgram(programId);
      expect(program.totalDeposited).to.equal(FUNDING_GOAL);
    });

    it("should release 20% logistics advance to NGO once goal reached", async function () {
      await escrow.connect(donor1).donate(programId, FUNDING_GOAL);

      const ngoBefore = await mockUsdc.balanceOf(ngo.address);
      const expectedAdvance = (FUNDING_GOAL * 2000n) / 10000n; // 2,000 USDC

      await expect(escrow.connect(ngo).releaseAdvance(programId))
        .to.emit(escrow, "AdvanceReleased")
        .withArgs(programId, ngo.address, expectedAdvance);

      const ngoAfter = await mockUsdc.balanceOf(ngo.address);
      expect(ngoAfter - ngoBefore).to.equal(expectedAdvance);
    });
  });

  describe("3. Proof of Aid: Proof Submission & AI Oracle Approval", function () {
    let programId = 1;
    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("supplier_invoice_and_delivery_note_sha256"));

    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(ngo).createAidProgram(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [STAGE_PROCUREMENT_AMOUNT, STAGE_DISTRIBUTION_AMOUNT],
        [now + 86400, now + 172800],
        [0, 1]
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await escrow.connect(donor1).donate(programId, FUNDING_GOAL);
    });

    it("should allow NGO to submit proof of procurement with SHA-256 hash", async function () {
      await expect(escrow.connect(ngo).submitProof(programId, 0, proofHash))
        .to.emit(escrow, "ProofSubmitted")
        .withArgs(programId, 0, 0, proofHash); // stageType = 0 (Procurement)

      const milestone = await escrow.getMilestone(programId, 0);
      expect(milestone.status).to.equal(1); // Submitted
      expect(milestone.reportHash).to.equal(proofHash);
    });

    it("should approve stage with oracle ECDSA signature and track beneficiaries", async function () {
      await escrow.connect(ngo).submitProof(programId, 0, proofHash);

      const nonce = 0;
      const beneficiaryCount = 1250; // 1,250 confirmed beneficiaries
      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [programId, 0, proofHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(msgHash));

      const ngoBefore = await mockUsdc.balanceOf(ngo.address);

      await expect(escrow.approveMilestone(programId, 0, beneficiaryCount, signature))
        .to.emit(escrow, "MilestoneApproved")
        .withArgs(programId, 0, STAGE_PROCUREMENT_AMOUNT, beneficiaryCount, nonce)
        .and.to.emit(escrow, "BeneficiaryCountUpdated")
        .withArgs(programId, beneficiaryCount);

      const ngoAfter = await mockUsdc.balanceOf(ngo.address);
      expect(ngoAfter - ngoBefore).to.equal(STAGE_PROCUREMENT_AMOUNT);

      const program = await escrow.getAidProgram(programId);
      expect(program.totalBeneficiaries).to.equal(beneficiaryCount);
    });
  });

  describe("4. Proportional Refund on Milestone Failure", function () {
    let programId = 1;
    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("fraudulent_supplier_invoice"));
    const rejectHash = ethers.keccak256(ethers.toUtf8Bytes("AI Oracle flagged duplicate invoice & price markup"));

    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(ngo).createAidProgram(
        oracle.address,
        await mockUsdc.getAddress(),
        FUNDING_GOAL,
        [STAGE_PROCUREMENT_AMOUNT, STAGE_DISTRIBUTION_AMOUNT],
        [now + 86400, now + 172800],
        [0, 1]
      );

      const escrowAddr = await escrow.getAddress();
      await mockUsdc.connect(donor1).approve(escrowAddr, ethers.MaxUint256);
      await mockUsdc.connect(donor2).approve(escrowAddr, ethers.MaxUint256);

      // Donor1: 7,000 (70%), Donor2: 3,000 (30%)
      await escrow.connect(donor1).donate(programId, ethers.parseUnits("7000", 6));
      await escrow.connect(donor2).donate(programId, ethers.parseUnits("3000", 6));

      await escrow.connect(ngo).submitProof(programId, 0, proofHash);
    });

    it("should reject milestone upon AI fraud detection and allow proportional donor refunds", async function () {
      const nonce = 0;
      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32", "uint256"],
        [programId, 0, proofHash, nonce]
      );
      const signature = await oracle.signMessage(ethers.getBytes(msgHash));

      await expect(escrow.rejectMilestone(programId, 0, rejectHash, signature))
        .to.emit(escrow, "MilestoneRejected")
        .withArgs(programId, 0, rejectHash, nonce);

      const d1Before = await mockUsdc.balanceOf(donor1.address);
      const d2Before = await mockUsdc.balanceOf(donor2.address);

      // Donor1 claims 70% refund
      await escrow.refund(programId, donor1.address);
      expect((await mockUsdc.balanceOf(donor1.address)) - d1Before).to.equal(ethers.parseUnits("7000", 6));

      // Donor2 claims 30% refund
      await escrow.refund(programId, donor2.address);
      expect((await mockUsdc.balanceOf(donor2.address)) - d2Before).to.equal(ethers.parseUnits("3000", 6));
    });
  });
});
