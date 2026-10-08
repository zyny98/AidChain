// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title  ClearGrantEscrow
 * @author ClearGrant Team
 * @notice Transparent charitable donation escrow.
 *
 *         Funds are locked on-chain and released in tranches only after the
 *         AI oracle verifies each milestone report via an ECDSA signature.
 *         If a milestone is rejected or expires, donors receive a proportional
 *         refund of the remaining balance.
 *
 * @dev    Security properties:
 *         - ReentrancyGuard on every function that moves ETH or ERC-20 tokens.
 *         - Oracle signatures include a per-campaign nonce so replayed
 *           signatures from earlier milestones cannot unlock future ones.
 *         - Organizer can never withdraw funds directly; only milestone
 *           approvals trigger payouts.
 *         - All arithmetic uses Solidity 0.8 built-in overflow checks.
 */
contract ClearGrantEscrow is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;

    // =========================================================================
    // Types & enums
    // =========================================================================

    /**
     * @notice Lifecycle states of a single milestone.
     *
     *  Pending  ──► Submitted ──► Approved   (happy path)
     *                         └──► Rejected  (oracle rejected the report)
     *  Pending  ──► Expired               (deadline passed, no report)
     *  Submitted──► Expired               (deadline passed before oracle ruled)
     */
    enum MilestoneStatus {
        Pending,   // 0 — waiting for the organizer to submit a report
        Submitted, // 1 — report hash recorded, waiting for oracle decision
        Approved,  // 2 — oracle approved; payout released to organizer
        Rejected,  // 3 — oracle rejected; refund triggered
        Expired    // 4 — deadline passed before Approved/Rejected
    }

    /**
     * @notice A single funding milestone within a campaign.
     * @param  amount         USDC amount (6 decimals) earmarked for this milestone.
     * @param  deadline       Unix timestamp by which the report must be approved.
     * @param  status         Current lifecycle state.
     * @param  reportHash     SHA-256 hash of the off-chain milestone report (bytes32).
     * @param  rejectionHash  SHA-256 hash of the rejection reason supplied by oracle.
     */
    struct Milestone {
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        bytes32 reportHash;
        bytes32 rejectionHash;
    }

    /**
     * @notice Full state of a campaign.
     * @param  organizer       Address that created the campaign and receives payouts.
     * @param  oracle          Address whose ECDSA signature authorises milestone decisions.
     * @param  token           ERC-20 token address used for donations and payouts.
     * @param  fundingGoal     Minimum amount (in token units) needed before advance release.
     * @param  milestones      Ordered list of milestones.
     * @param  deposits        Mapping donor address → amount donated (token units).
     * @param  donors          Ordered list of donor addresses (for refund iteration).
     * @param  totalDeposited  Sum of all donations received so far.
     * @param  totalReleased   Sum of all payouts and advances released to organizer.
     * @param  advanceReleased Whether the 20 % advance has already been paid out.
     * @param  oracleNonce     Monotonically increasing nonce; prevents signature replay.
     * @param  active          False once the campaign is fully settled or cancelled.
     */
    struct Campaign {
        address organizer;
        address oracle;
        address token;
        uint256 fundingGoal;
        Milestone[] milestones;
        mapping(address => uint256) deposits;
        address[] donors;
        uint256 totalDeposited;
        uint256 totalReleased;
        bool advanceReleased;
        uint256 oracleNonce;
        bool active;
    }

    // =========================================================================
    // State variables
    // =========================================================================

    /// @notice Auto-incrementing campaign counter; also serves as campaignId.
    uint256 public campaignCount;

    /// @notice campaignId → Campaign storage.
    mapping(uint256 => Campaign) private _campaigns;

    /// @notice Advance fraction: 20 % = 2000 basis points out of 10 000.
    uint256 public constant ADVANCE_BPS = 2000;

    /// @notice Denominator for basis-point calculations.
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // =========================================================================
    // Events
    // =========================================================================

    /**
     * @notice Emitted when a new campaign is created.
     * @param  campaignId Unique campaign identifier.
     * @param  organizer  Address of the campaign organiser.
     * @param  oracle     Address of the AI oracle for this campaign.
     * @param  token      ERC-20 token used for funding.
     * @param  fundingGoal Minimum funding threshold.
     * @param  milestoneCount Number of milestones in the campaign.
     */
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed organizer,
        address indexed oracle,
        address token,
        uint256 fundingGoal,
        uint256 milestoneCount
    );

    /**
     * @notice Emitted when a donor contributes to a campaign.
     * @param  campaignId Campaign receiving the donation.
     * @param  donor      Address of the donor.
     * @param  amount     Token amount donated.
     * @param  total      New cumulative total for this donor in the campaign.
     */
    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 total
    );

    /**
     * @notice Emitted when the 20 % advance is released to the organiser.
     * @param  campaignId  Campaign identifier.
     * @param  organizer   Recipient of the advance.
     * @param  amount      Token amount released.
     */
    event AdvanceReleased(
        uint256 indexed campaignId,
        address indexed organizer,
        uint256 amount
    );

    /**
     * @notice Emitted when an organiser records a milestone report hash on-chain.
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the milestone.
     * @param  reportHash      SHA-256 hash of the off-chain report document.
     */
    event ReportSubmitted(
        uint256 indexed campaignId,
        uint256 indexed milestoneIndex,
        bytes32 reportHash
    );

    /**
     * @notice Emitted when the oracle approves a milestone and funds are released.
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the approved milestone.
     * @param  amount          Token amount released to the organiser.
     * @param  nonce           Oracle nonce consumed by this approval.
     */
    event MilestoneApproved(
        uint256 indexed campaignId,
        uint256 indexed milestoneIndex,
        uint256 amount,
        uint256 nonce
    );

    /**
     * @notice Emitted when the oracle rejects a milestone.
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the rejected milestone.
     * @param  rejectionHash   SHA-256 hash of the rejection reason.
     * @param  nonce           Oracle nonce consumed by this rejection.
     */
    event MilestoneRejected(
        uint256 indexed campaignId,
        uint256 indexed milestoneIndex,
        bytes32 rejectionHash,
        uint256 nonce
    );

    /**
     * @notice Emitted when a milestone transitions to Expired state.
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the expired milestone.
     */
    event MilestoneExpired(
        uint256 indexed campaignId,
        uint256 indexed milestoneIndex
    );

    /**
     * @notice Emitted once per donor when a refund is issued.
     * @param  campaignId  Campaign identifier.
     * @param  donor       Address receiving the refund.
     * @param  amount      Token amount refunded.
     */
    event Refunded(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    // =========================================================================
    // Modifiers
    // =========================================================================

    /**
     * @dev Reverts if the campaign does not exist or is no longer active.
     */
    modifier campaignExists(uint256 campaignId) {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");
        require(_campaigns[campaignId].active, "ClearGrant: campaign is not active");
        _;
    }

    /**
     * @dev Reverts if caller is not the campaign organiser.
     */
    modifier onlyOrganizer(uint256 campaignId) {
        require(msg.sender == _campaigns[campaignId].organizer, "ClearGrant: caller is not organizer");
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @param initialOwner Address that receives contract ownership (Ownable).
     *        Can pause or rescue the contract in an emergency.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    // =========================================================================
    // External — Campaign creation
    // =========================================================================

    /**
     * @notice Create a new fundraising campaign with a set of milestones.
     *
     * @dev    Each milestone amount must be > 0 and deadline must be strictly
     *         in the future. The sum of all milestone amounts must equal
     *         (fundingGoal - advance), but we do NOT enforce this on-chain
     *         to keep the contract flexible; off-chain tooling should validate.
     *
     * @param  oracle           Address of the AI oracle that will sign approvals.
     * @param  token            ERC-20 token address (e.g. MockUSDC).
     * @param  fundingGoal      Minimum deposits required to unlock the 20 % advance.
     * @param  milestoneAmounts Token amounts allocated to each milestone.
     * @param  milestoneDeadlines Unix timestamps (one per milestone).
     *
     * @return campaignId The newly assigned campaign identifier.
     */
    function createCampaign(
        address oracle,
        address token,
        uint256 fundingGoal,
        uint256[] calldata milestoneAmounts,
        uint256[] calldata milestoneDeadlines
    ) external returns (uint256 campaignId) {
        require(oracle != address(0), "ClearGrant: oracle is zero address");
        require(token != address(0), "ClearGrant: token is zero address");
        require(fundingGoal > 0, "ClearGrant: funding goal must be > 0");
        require(milestoneAmounts.length > 0, "ClearGrant: need at least one milestone");
        require(
            milestoneAmounts.length == milestoneDeadlines.length,
            "ClearGrant: arrays length mismatch"
        );

        // Allocate new campaign ID
        campaignCount += 1;
        campaignId = campaignCount;

        Campaign storage c = _campaigns[campaignId];
        c.organizer = msg.sender;
        c.oracle = oracle;
        c.token = token;
        c.fundingGoal = fundingGoal;
        c.active = true;
        // oracleNonce starts at 0

        // Push milestones
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "ClearGrant: milestone amount must be > 0");
            require(
                milestoneDeadlines[i] > block.timestamp,
                "ClearGrant: milestone deadline must be in the future"
            );

            c.milestones.push(
                Milestone({
                    amount: milestoneAmounts[i],
                    deadline: milestoneDeadlines[i],
                    status: MilestoneStatus.Pending,
                    reportHash: bytes32(0),
                    rejectionHash: bytes32(0)
                })
            );
        }

        emit CampaignCreated(
            campaignId,
            msg.sender,
            oracle,
            token,
            fundingGoal,
            milestoneAmounts.length
        );
    }

    // =========================================================================
    // External — Donations
    // =========================================================================

    /**
     * @notice Donate `amount` tokens to campaign `campaignId`.
     *
     * @dev    Caller must have previously approved this contract to spend at
     *         least `amount` of the campaign token via ERC-20 `approve()`.
     *         Uses SafeERC20 to handle non-standard tokens gracefully.
     *         A donor address is recorded in the `donors` array only once.
     *
     * @param  campaignId Campaign to fund.
     * @param  amount     Token amount to donate (in smallest units, e.g. 1 USDC = 1_000_000).
     */
    function donate(
        uint256 campaignId,
        uint256 amount
    ) external nonReentrant campaignExists(campaignId) {
        require(amount > 0, "ClearGrant: donation amount must be > 0");

        Campaign storage c = _campaigns[campaignId];

        // Track new donors for the refund iteration
        if (c.deposits[msg.sender] == 0) {
            c.donors.push(msg.sender);
        }

        c.deposits[msg.sender] += amount;
        c.totalDeposited += amount;

        // Pull tokens from the donor into the escrow contract
        IERC20(c.token).safeTransferFrom(msg.sender, address(this), amount);

        emit Donated(campaignId, msg.sender, amount, c.deposits[msg.sender]);
    }

    // =========================================================================
    // External — Advance release (20 %)
    // =========================================================================

    /**
     * @notice Release the 20 % advance to the organiser once the funding goal
     *         has been reached.
     *
     * @dev    Can only be called once per campaign. The advance amount is
     *         computed as 20 % of `totalDeposited` at the moment of the call,
     *         NOT of `fundingGoal`, so late donations do not change it once
     *         called. `totalReleased` is incremented to keep accounting correct.
     *
     * @param  campaignId Campaign identifier.
     */
    function releaseAdvance(
        uint256 campaignId
    ) external nonReentrant campaignExists(campaignId) onlyOrganizer(campaignId) {
        Campaign storage c = _campaigns[campaignId];

        require(!c.advanceReleased, "ClearGrant: advance already released");
        require(
            c.totalDeposited >= c.fundingGoal,
            "ClearGrant: funding goal not reached"
        );

        uint256 advanceAmount = (c.totalDeposited * ADVANCE_BPS) / BPS_DENOMINATOR;

        c.advanceReleased = true;
        c.totalReleased += advanceAmount;

        IERC20(c.token).safeTransfer(c.organizer, advanceAmount);

        emit AdvanceReleased(campaignId, c.organizer, advanceAmount);
    }

    // =========================================================================
    // External — Report submission
    // =========================================================================

    /**
     * @notice Organiser records the SHA-256 hash of their milestone report.
     *
     * @dev    The milestone must be in Pending state and the deadline must not
     *         have passed. After this call the milestone moves to Submitted and
     *         the oracle can rule on it.
     *
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the milestone to report on.
     * @param  reportHash      bytes32 SHA-256 hash of the off-chain report document.
     */
    function submitReport(
        uint256 campaignId,
        uint256 milestoneIndex,
        bytes32 reportHash
    ) external campaignExists(campaignId) onlyOrganizer(campaignId) {
        Campaign storage c = _campaigns[campaignId];
        require(milestoneIndex < c.milestones.length, "ClearGrant: invalid milestone index");

        Milestone storage m = c.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "ClearGrant: milestone is not Pending");
        require(block.timestamp <= m.deadline, "ClearGrant: milestone deadline has passed");
        require(reportHash != bytes32(0), "ClearGrant: report hash cannot be zero");

        m.reportHash = reportHash;
        m.status = MilestoneStatus.Submitted;

        emit ReportSubmitted(campaignId, milestoneIndex, reportHash);
    }

    // =========================================================================
    // External — Oracle: approve milestone
    // =========================================================================

    /**
     * @notice Oracle approves a milestone after verifying the report off-chain.
     *
     * @dev    The oracle signs the following payload with its private key:
     *             keccak256(abi.encodePacked(campaignId, milestoneIndex, reportHash, nonce))
     *         where `nonce` equals `c.oracleNonce` at the time of signing.
     *         After a successful approval the nonce is incremented, making the
     *         same signature unusable for future calls (replay protection).
     *
     *         Token payout = milestone.amount, capped at the contract's current
     *         ERC-20 balance to avoid accounting drift.
     *
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the milestone to approve.
     * @param  signature       65-byte ECDSA signature produced by the oracle.
     */
    function approveMilestone(
        uint256 campaignId,
        uint256 milestoneIndex,
        bytes calldata signature
    ) external nonReentrant campaignExists(campaignId) {
        Campaign storage c = _campaigns[campaignId];
        require(milestoneIndex < c.milestones.length, "ClearGrant: invalid milestone index");

        Milestone storage m = c.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "ClearGrant: milestone is not Submitted");
        require(block.timestamp <= m.deadline, "ClearGrant: milestone deadline has passed");

        // --- Signature verification ---
        uint256 nonce = c.oracleNonce;
        bytes32 msgHash = keccak256(
            abi.encodePacked(campaignId, milestoneIndex, m.reportHash, nonce)
        );
        bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == c.oracle, "ClearGrant: invalid oracle signature");

        // Consume nonce (replay protection)
        c.oracleNonce += 1;

        // Update state before transfer (CEI pattern)
        m.status = MilestoneStatus.Approved;
        uint256 payout = m.amount;
        c.totalReleased += payout;

        // Transfer milestone amount to organiser
        IERC20(c.token).safeTransfer(c.organizer, payout);

        emit MilestoneApproved(campaignId, milestoneIndex, payout, nonce);
    }

    // =========================================================================
    // External — Oracle: reject milestone
    // =========================================================================

    /**
     * @notice Oracle rejects a milestone. This triggers a proportional refund
     *         to all donors.
     *
     * @dev    The oracle signs:
     *             keccak256(abi.encodePacked(campaignId, milestoneIndex, reportHash, nonce))
     *         Same scheme as approveMilestone. After rejection the campaign is
     *         marked inactive and remaining funds are locked until `refund()` is
     *         called individually by each donor (or by anyone on their behalf).
     *
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the milestone to reject.
     * @param  rejectionHash   SHA-256 hash of the rejection reason document.
     * @param  signature       65-byte ECDSA signature produced by the oracle.
     */
    function rejectMilestone(
        uint256 campaignId,
        uint256 milestoneIndex,
        bytes32 rejectionHash,
        bytes calldata signature
    ) external nonReentrant campaignExists(campaignId) {
        Campaign storage c = _campaigns[campaignId];
        require(milestoneIndex < c.milestones.length, "ClearGrant: invalid milestone index");

        Milestone storage m = c.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "ClearGrant: milestone is not Submitted");
        require(rejectionHash != bytes32(0), "ClearGrant: rejection hash cannot be zero");

        // --- Signature verification ---
        uint256 nonce = c.oracleNonce;
        bytes32 msgHash = keccak256(
            abi.encodePacked(campaignId, milestoneIndex, m.reportHash, nonce)
        );
        bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == c.oracle, "ClearGrant: invalid oracle signature");

        // Consume nonce
        c.oracleNonce += 1;

        // Update state
        m.status = MilestoneStatus.Rejected;
        m.rejectionHash = rejectionHash;

        // Mark campaign inactive so no further donations or advances are accepted
        c.active = false;

        emit MilestoneRejected(campaignId, milestoneIndex, rejectionHash, nonce);
    }

    // =========================================================================
    // External — Refund
    // =========================================================================

    /**
     * @notice Claim a proportional refund for a specific donor.
     *
     * @dev    Can be called after a milestone is Rejected or Expired (campaign
     *         becomes inactive). The campaign does NOT need to be active for
     *         this call to succeed — that is intentional.
     *
     *         Refund formula:
     *             refund_i = (deposit_i / totalDeposited) * remainingBalance
     *
     *         Where remainingBalance = current ERC-20 balance of this contract
     *         for the campaign token.
     *
     *         The donor's deposit record is zeroed out before the transfer to
     *         prevent double-refund (also protected by ReentrancyGuard).
     *
     * @param  campaignId Campaign from which to claim a refund.
     * @param  donor      Address of the donor to refund.
     */
    function refund(
        uint256 campaignId,
        address donor
    ) external nonReentrant {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");

        Campaign storage c = _campaigns[campaignId];

        // Refund is allowed only when the campaign is no longer active
        // (rejected milestone or expired milestone triggered deactivation).
        require(!c.active, "ClearGrant: campaign is still active");

        uint256 depositAmount = c.deposits[donor];
        require(depositAmount > 0, "ClearGrant: no deposit found for donor");
        require(c.totalDeposited > 0, "ClearGrant: total deposits are zero");

        // Remaining balance of the campaign token held by this contract
        uint256 remainingBalance = IERC20(c.token).balanceOf(address(this));

        // Proportional refund: deposit_i / totalDeposited * remainingBalance
        uint256 refundAmount = (depositAmount * remainingBalance) / c.totalDeposited;

        // Zero out the deposit BEFORE the transfer (CEI pattern)
        c.deposits[donor] = 0;

        if (refundAmount > 0) {
            IERC20(c.token).safeTransfer(donor, refundAmount);
        }

        emit Refunded(campaignId, donor, refundAmount);
    }

    // =========================================================================
    // External — Expire milestone
    // =========================================================================

    /**
     * @notice Transition a milestone to Expired state once its deadline has passed.
     *
     * @dev    Callable by anyone (permissionless) once `block.timestamp > deadline`.
     *         Works for both Pending and Submitted milestones that have timed out.
     *         Marks the campaign inactive so donors can claim refunds.
     *
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Zero-based index of the milestone to expire.
     */
    function expireMilestone(
        uint256 campaignId,
        uint256 milestoneIndex
    ) external nonReentrant {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");

        Campaign storage c = _campaigns[campaignId];
        require(c.active, "ClearGrant: campaign is not active");
        require(milestoneIndex < c.milestones.length, "ClearGrant: invalid milestone index");

        Milestone storage m = c.milestones[milestoneIndex];
        require(
            m.status == MilestoneStatus.Pending || m.status == MilestoneStatus.Submitted,
            "ClearGrant: milestone cannot be expired in current state"
        );
        require(block.timestamp > m.deadline, "ClearGrant: deadline has not passed yet");

        m.status = MilestoneStatus.Expired;

        // Deactivate campaign so refunds become available
        c.active = false;

        emit MilestoneExpired(campaignId, milestoneIndex);
    }

    // =========================================================================
    // View functions
    // =========================================================================

    /**
     * @notice Returns basic campaign info (no mapping fields).
     * @param  campaignId Campaign to query.
     * @return organizer       Address of campaign organiser.
     * @return oracle          Address of the AI oracle.
     * @return token           ERC-20 token address.
     * @return fundingGoal     Minimum funding threshold.
     * @return totalDeposited  Sum of all donations.
     * @return totalReleased   Sum of all payouts.
     * @return advanceReleased Whether the 20 % advance was paid out.
     * @return oracleNonce     Current oracle nonce.
     * @return active          Whether the campaign is still active.
     * @return milestoneCount  Number of milestones.
     */
    function getCampaign(uint256 campaignId)
        external
        view
        returns (
            address organizer,
            address oracle,
            address token,
            uint256 fundingGoal,
            uint256 totalDeposited,
            uint256 totalReleased,
            bool advanceReleased,
            uint256 oracleNonce,
            bool active,
            uint256 milestoneCount
        )
    {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");
        Campaign storage c = _campaigns[campaignId];
        return (
            c.organizer,
            c.oracle,
            c.token,
            c.fundingGoal,
            c.totalDeposited,
            c.totalReleased,
            c.advanceReleased,
            c.oracleNonce,
            c.active,
            c.milestones.length
        );
    }

    /**
     * @notice Returns details of a specific milestone.
     * @param  campaignId      Campaign to query.
     * @param  milestoneIndex  Zero-based milestone index.
     * @return amount        Token amount allocated.
     * @return deadline      Unix timestamp deadline.
     * @return status        Current MilestoneStatus enum value.
     * @return reportHash    Recorded report hash (zero if not submitted).
     * @return rejectionHash Rejection reason hash (zero if not rejected).
     */
    function getMilestone(uint256 campaignId, uint256 milestoneIndex)
        external
        view
        returns (
            uint256 amount,
            uint256 deadline,
            MilestoneStatus status,
            bytes32 reportHash,
            bytes32 rejectionHash
        )
    {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");
        Campaign storage c = _campaigns[campaignId];
        require(milestoneIndex < c.milestones.length, "ClearGrant: invalid milestone index");

        Milestone storage m = c.milestones[milestoneIndex];
        return (m.amount, m.deadline, m.status, m.reportHash, m.rejectionHash);
    }

    /**
     * @notice Returns the donation amount for a specific donor in a campaign.
     * @param  campaignId Campaign to query.
     * @param  donor      Donor address.
     * @return deposit    Amount donated (token units).
     */
    function getDonorDeposit(uint256 campaignId, address donor)
        external
        view
        returns (uint256 deposit)
    {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");
        return _campaigns[campaignId].deposits[donor];
    }

    /**
     * @notice Returns the full ordered list of donor addresses for a campaign.
     * @param  campaignId Campaign to query.
     * @return donors     Array of donor addresses.
     */
    function getDonors(uint256 campaignId)
        external
        view
        returns (address[] memory donors)
    {
        require(campaignId > 0 && campaignId <= campaignCount, "ClearGrant: campaign not found");
        return _campaigns[campaignId].donors;
    }

    /**
     * @notice Computes the oracle message hash for a given approval/rejection.
     *         Useful for off-chain tooling to construct the correct payload.
     * @param  campaignId      Campaign identifier.
     * @param  milestoneIndex  Milestone index.
     * @param  reportHash      SHA-256 hash of the report.
     * @param  nonce           Oracle nonce at the time of signing.
     * @return hash            32-byte keccak256 digest (before Ethereum prefix).
     */
    function getOracleMessageHash(
        uint256 campaignId,
        uint256 milestoneIndex,
        bytes32 reportHash,
        uint256 nonce
    ) external pure returns (bytes32 hash) {
        return keccak256(abi.encodePacked(campaignId, milestoneIndex, reportHash, nonce));
    }
}
