// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title  AidChainEscrow
 * @author AIDCHAIN Team
 * @notice Proof of Aid — Blockchain platform for transparent humanitarian aid.
 *
 *         Full supply chain: Donor → NGO → Supplier → Distributor → Beneficiary
 *
 *         Funds are locked on-chain and released in tranches only after the
 *         AI oracle verifies each milestone: procurement receipts, delivery
 *         confirmations and beneficiary distribution reports.
 *
 * @dev    Security:
 *         - ReentrancyGuard on every function that moves tokens.
 *         - ECDSA oracle signature with per-aid-program nonce (replay protection).
 *         - NGO cannot withdraw without verified milestone proofs.
 */
contract AidChainEscrow is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;

    // =========================================================================
    // Types & enums
    // =========================================================================

    enum MilestoneStatus {
        Pending,    // 0 — waiting for NGO to submit proof
        Submitted,  // 1 — proof hash recorded on-chain, awaiting oracle decision
        Approved,   // 2 — oracle approved; tranche released
        Rejected,   // 3 — oracle rejected; refund available
        Expired     // 4 — deadline passed without approval
    }

    /**
     * @notice Aid supply chain stage type.
     * @dev Stored per milestone for audit trail.
     */
    enum StageType {
        Procurement,   // 0 — buying goods from supplier
        Distribution,  // 1 — distributing to beneficiaries via distributor
        Reporting      // 2 — final impact report (beneficiary count confirmed)
    }

    /**
     * @notice A single funding milestone within an aid program.
     */
    struct Milestone {
        uint256 amount;           // USDC amount earmarked for this milestone
        uint256 deadline;         // Unix timestamp for report submission deadline
        MilestoneStatus status;   // Current state
        StageType stageType;      // Supply chain stage
        bytes32 reportHash;       // SHA-256 hash of the off-chain proof document
        bytes32 rejectionHash;    // SHA-256 hash of rejection reason
        uint256 beneficiaryCount; // Number of beneficiaries served (for Reporting stage)
        string stageDescription;  // Human-readable stage description (off-chain reference)
    }

    /**
     * @notice Full state of an aid program.
     */
    struct AidProgram {
        address ngo;              // NGO address that created and manages the program
        address oracle;           // AI oracle address that signs milestone decisions
        address token;            // ERC-20 token (stablecoin)
        uint256 fundingGoal;      // Minimum threshold to unlock advance
        Milestone[] milestones;
        mapping(address => uint256) deposits; // donor → amount donated
        address[] donors;
        uint256 totalDeposited;
        uint256 totalReleased;
        bool advanceReleased;
        uint256 oracleNonce;
        bool active;
        uint256 totalBeneficiaries; // Cumulative beneficiary count across approved milestones
    }

    // =========================================================================
    // State
    // =========================================================================

    uint256 public programCount;
    mapping(uint256 => AidProgram) private _programs;

    uint256 public constant ADVANCE_BPS = 2000;   // 20%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // =========================================================================
    // Events — full supply chain audit trail
    // =========================================================================

    event AidProgramCreated(
        uint256 indexed programId,
        address indexed ngo,
        address indexed oracle,
        address token,
        uint256 fundingGoal,
        uint256 milestoneCount
    );

    event Donated(
        uint256 indexed programId,
        address indexed donor,
        uint256 amount,
        uint256 totalDonorDeposit
    );

    event AdvanceReleased(
        uint256 indexed programId,
        address indexed ngo,
        uint256 amount
    );

    event ProofSubmitted(
        uint256 indexed programId,
        uint256 indexed milestoneIndex,
        StageType stageType,
        bytes32 reportHash
    );

    event MilestoneApproved(
        uint256 indexed programId,
        uint256 indexed milestoneIndex,
        uint256 amount,
        uint256 beneficiaryCount,
        uint256 nonce
    );

    event MilestoneRejected(
        uint256 indexed programId,
        uint256 indexed milestoneIndex,
        bytes32 rejectionHash,
        uint256 nonce
    );

    event MilestoneExpired(
        uint256 indexed programId,
        uint256 indexed milestoneIndex
    );

    event Refunded(
        uint256 indexed programId,
        address indexed donor,
        uint256 amount
    );

    event BeneficiaryCountUpdated(
        uint256 indexed programId,
        uint256 totalBeneficiaries
    );

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier programExists(uint256 programId) {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");
        require(_programs[programId].active, "AidChain: program is not active");
        _;
    }

    modifier onlyNGO(uint256 programId) {
        require(msg.sender == _programs[programId].ngo, "AidChain: caller is not the NGO");
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address initialOwner) Ownable(initialOwner) {}

    // =========================================================================
    // Aid Program Creation
    // =========================================================================

    /**
     * @notice Create a new humanitarian aid program with supply chain milestones.
     *
     * @param oracle               AI oracle address for this program.
     * @param token                ERC-20 stablecoin address.
     * @param fundingGoal          Minimum deposits required to unlock advance.
     * @param milestoneAmounts     USDC amounts per milestone.
     * @param milestoneDeadlines   Unix timestamps per milestone.
     * @param milestoneStageTypes  Supply chain stage types per milestone.
     *
     * @return programId New aid program identifier.
     */
    function createAidProgram(
        address oracle,
        address token,
        uint256 fundingGoal,
        uint256[] calldata milestoneAmounts,
        uint256[] calldata milestoneDeadlines,
        uint8[] calldata milestoneStageTypes
    ) external returns (uint256 programId) {
        require(oracle != address(0), "AidChain: oracle is zero address");
        require(token != address(0), "AidChain: token is zero address");
        require(fundingGoal > 0, "AidChain: funding goal must be > 0");
        require(milestoneAmounts.length > 0, "AidChain: need at least one milestone");
        require(
            milestoneAmounts.length == milestoneDeadlines.length &&
            milestoneAmounts.length == milestoneStageTypes.length,
            "AidChain: arrays length mismatch"
        );

        programCount += 1;
        programId = programCount;

        AidProgram storage p = _programs[programId];
        p.ngo = msg.sender;
        p.oracle = oracle;
        p.token = token;
        p.fundingGoal = fundingGoal;
        p.active = true;

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "AidChain: milestone amount must be > 0");
            require(
                milestoneDeadlines[i] > block.timestamp,
                "AidChain: milestone deadline must be in the future"
            );
            require(milestoneStageTypes[i] <= 2, "AidChain: invalid stage type");

            p.milestones.push(
                Milestone({
                    amount: milestoneAmounts[i],
                    deadline: milestoneDeadlines[i],
                    status: MilestoneStatus.Pending,
                    stageType: StageType(milestoneStageTypes[i]),
                    reportHash: bytes32(0),
                    rejectionHash: bytes32(0),
                    beneficiaryCount: 0,
                    stageDescription: ""
                })
            );
        }

        emit AidProgramCreated(programId, msg.sender, oracle, token, fundingGoal, milestoneAmounts.length);
    }

    // =========================================================================
    // Donations
    // =========================================================================

    function donate(
        uint256 programId,
        uint256 amount
    ) external nonReentrant programExists(programId) {
        require(amount > 0, "AidChain: donation must be > 0");

        AidProgram storage p = _programs[programId];
        if (p.deposits[msg.sender] == 0) {
            p.donors.push(msg.sender);
        }
        p.deposits[msg.sender] += amount;
        p.totalDeposited += amount;

        IERC20(p.token).safeTransferFrom(msg.sender, address(this), amount);
        emit Donated(programId, msg.sender, amount, p.deposits[msg.sender]);
    }

    // =========================================================================
    // Advance Release (20%)
    // =========================================================================

    function releaseAdvance(
        uint256 programId
    ) external nonReentrant programExists(programId) onlyNGO(programId) {
        AidProgram storage p = _programs[programId];
        require(!p.advanceReleased, "AidChain: advance already released");
        require(p.totalDeposited >= p.fundingGoal, "AidChain: funding goal not reached");

        uint256 advanceAmount = (p.totalDeposited * ADVANCE_BPS) / BPS_DENOMINATOR;
        p.advanceReleased = true;
        p.totalReleased += advanceAmount;

        IERC20(p.token).safeTransfer(p.ngo, advanceAmount);
        emit AdvanceReleased(programId, p.ngo, advanceAmount);
    }

    // =========================================================================
    // Proof Submission (NGO submits procurement/distribution evidence)
    // =========================================================================

    /**
     * @notice NGO records SHA-256 hash of procurement receipt, delivery note,
     *         or beneficiary distribution report on-chain.
     */
    function submitProof(
        uint256 programId,
        uint256 milestoneIndex,
        bytes32 reportHash
    ) external programExists(programId) onlyNGO(programId) {
        AidProgram storage p = _programs[programId];
        require(milestoneIndex < p.milestones.length, "AidChain: invalid milestone index");

        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "AidChain: milestone is not Pending");
        require(block.timestamp <= m.deadline, "AidChain: milestone deadline has passed");
        require(reportHash != bytes32(0), "AidChain: report hash cannot be zero");

        m.reportHash = reportHash;
        m.status = MilestoneStatus.Submitted;

        emit ProofSubmitted(programId, milestoneIndex, m.stageType, reportHash);
    }

    // =========================================================================
    // Oracle: Approve Milestone
    // =========================================================================

    /**
     * @notice AI oracle approves a milestone after verifying evidence off-chain.
     *
     * @dev Signature covers: keccak256(abi.encodePacked(programId, milestoneIndex, reportHash, nonce))
     *
     * @param beneficiaryCount Number of beneficiaries confirmed in this milestone (0 for procurement).
     */
    function approveMilestone(
        uint256 programId,
        uint256 milestoneIndex,
        uint256 beneficiaryCount,
        bytes calldata signature
    ) external nonReentrant programExists(programId) {
        AidProgram storage p = _programs[programId];
        require(milestoneIndex < p.milestones.length, "AidChain: invalid milestone index");

        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "AidChain: milestone is not Submitted");
        require(block.timestamp <= m.deadline, "AidChain: milestone deadline has passed");

        // Verify oracle ECDSA signature
        uint256 nonce = p.oracleNonce;
        bytes32 msgHash = keccak256(
            abi.encodePacked(programId, milestoneIndex, m.reportHash, nonce)
        );
        bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == p.oracle, "AidChain: invalid oracle signature");

        // Consume nonce (replay protection)
        p.oracleNonce += 1;

        // Update state (CEI)
        m.status = MilestoneStatus.Approved;
        m.beneficiaryCount = beneficiaryCount;
        uint256 payout = m.amount;
        p.totalReleased += payout;
        p.totalBeneficiaries += beneficiaryCount;

        IERC20(p.token).safeTransfer(p.ngo, payout);

        emit MilestoneApproved(programId, milestoneIndex, payout, beneficiaryCount, nonce);
        if (beneficiaryCount > 0) {
            emit BeneficiaryCountUpdated(programId, p.totalBeneficiaries);
        }
    }

    // =========================================================================
    // Oracle: Reject Milestone
    // =========================================================================

    function rejectMilestone(
        uint256 programId,
        uint256 milestoneIndex,
        bytes32 rejectionHash,
        bytes calldata signature
    ) external nonReentrant programExists(programId) {
        AidProgram storage p = _programs[programId];
        require(milestoneIndex < p.milestones.length, "AidChain: invalid milestone index");

        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "AidChain: milestone is not Submitted");
        require(rejectionHash != bytes32(0), "AidChain: rejection hash cannot be zero");

        uint256 nonce = p.oracleNonce;
        bytes32 msgHash = keccak256(
            abi.encodePacked(programId, milestoneIndex, m.reportHash, nonce)
        );
        bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == p.oracle, "AidChain: invalid oracle signature");

        p.oracleNonce += 1;
        m.status = MilestoneStatus.Rejected;
        m.rejectionHash = rejectionHash;
        p.active = false;

        emit MilestoneRejected(programId, milestoneIndex, rejectionHash, nonce);
    }

    // =========================================================================
    // Refund (proportional)
    // =========================================================================

    /**
     * @notice Donor claims proportional refund.
     *         Formula: refund_i = (deposit_i / totalDeposited) * remainingBalance
     */
    function refund(uint256 programId, address donor) external nonReentrant {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");

        AidProgram storage p = _programs[programId];
        require(!p.active, "AidChain: program is still active");

        uint256 depositAmount = p.deposits[donor];
        require(depositAmount > 0, "AidChain: no deposit found for donor");
        require(p.totalDeposited > 0, "AidChain: total deposits are zero");

        uint256 remainingBalance = IERC20(p.token).balanceOf(address(this));
        uint256 refundAmount = (depositAmount * remainingBalance) / p.totalDeposited;

        p.deposits[donor] = 0;
        if (refundAmount > 0) {
            IERC20(p.token).safeTransfer(donor, refundAmount);
        }

        emit Refunded(programId, donor, refundAmount);
    }

    // =========================================================================
    // Expire Milestone
    // =========================================================================

    function expireMilestone(uint256 programId, uint256 milestoneIndex) external nonReentrant {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");

        AidProgram storage p = _programs[programId];
        require(p.active, "AidChain: program is not active");
        require(milestoneIndex < p.milestones.length, "AidChain: invalid milestone index");

        Milestone storage m = p.milestones[milestoneIndex];
        require(
            m.status == MilestoneStatus.Pending || m.status == MilestoneStatus.Submitted,
            "AidChain: cannot expire in current state"
        );
        require(block.timestamp > m.deadline, "AidChain: deadline has not passed yet");

        m.status = MilestoneStatus.Expired;
        p.active = false;

        emit MilestoneExpired(programId, milestoneIndex);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getAidProgram(uint256 programId)
        external
        view
        returns (
            address ngo,
            address oracle,
            address token,
            uint256 fundingGoal,
            uint256 totalDeposited,
            uint256 totalReleased,
            bool advanceReleased,
            uint256 oracleNonce,
            bool active,
            uint256 milestoneCount,
            uint256 totalBeneficiaries
        )
    {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");
        AidProgram storage p = _programs[programId];
        return (
            p.ngo,
            p.oracle,
            p.token,
            p.fundingGoal,
            p.totalDeposited,
            p.totalReleased,
            p.advanceReleased,
            p.oracleNonce,
            p.active,
            p.milestones.length,
            p.totalBeneficiaries
        );
    }

    function getMilestone(uint256 programId, uint256 milestoneIndex)
        external
        view
        returns (
            uint256 amount,
            uint256 deadline,
            MilestoneStatus status,
            StageType stageType,
            bytes32 reportHash,
            bytes32 rejectionHash,
            uint256 beneficiaryCount
        )
    {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");
        AidProgram storage p = _programs[programId];
        require(milestoneIndex < p.milestones.length, "AidChain: invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        return (m.amount, m.deadline, m.status, m.stageType, m.reportHash, m.rejectionHash, m.beneficiaryCount);
    }

    function getDonorDeposit(uint256 programId, address donor) external view returns (uint256) {
        require(programId > 0 && programId <= programCount, "AidChain: program not found");
        return _programs[programId].deposits[donor];
    }
}
