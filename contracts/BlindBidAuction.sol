// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    ebool,
    euint32,
    euint64,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BlindBidAuction
/// @notice Blind bid auction manager using Zama fhEVM encrypted types.
/// @dev Implements fail-closed access control, encrypted bid aggregation, and gateway reveal hooks.
contract BlindBidAuction is SepoliaConfig {
    struct Lot {
        address curator;
        uint64 startTime;
        uint64 endTime;
        bool closed;
        bool revealRequested;
        bool settled;
        uint32 bidCount;
        euint64 encryptedReserve;
        euint64 encryptedWinningBid;
        euint32 encryptedWinningIndex;
        address winner;
        uint64 revealedAmount;
        string metadataURI;
    }

    struct BidEnvelope {
        euint64 amount;
        bytes32 saltHash;
        uint64 submittedAt;
        uint32 index;
        bool isSealed;
    }

    struct LotSnapshot {
        address curator;
        uint64 startTime;
        uint64 endTime;
        bool closed;
        bool revealRequested;
        bool settled;
        uint32 bidCount;
        bytes32 encryptedReserve;
        bytes32 encryptedWinningBid;
        bytes32 encryptedWinningIndex;
        address winner;
        uint64 revealedAmount;
        string metadataURI;
    }

    uint256 private _nextLotId = 1;
    address public owner;
    address public gatewayOperator;

    mapping(uint256 => Lot) private _lots;
    mapping(uint256 => mapping(address => BidEnvelope)) private _bids;
    mapping(uint256 => mapping(bytes32 => bool)) private _saltRegistry;
    mapping(uint256 => mapping(uint32 => address)) private _indexToBidder;
    mapping(uint256 => address[]) private _lotParticipants;
    uint256[] private _lotIds;

    event LotCreated(uint256 indexed lotId, address indexed curator, uint64 startTime, uint64 endTime, string metadataURI);
    event BidSubmitted(uint256 indexed lotId, address indexed bidder, uint32 indexed bidIndex, bytes32 saltHash);
    event LotClosed(uint256 indexed lotId, address indexed curator);
    event RevealRequested(uint256 indexed lotId, address indexed operator);
    event RevealSettled(uint256 indexed lotId, address indexed winner, uint64 clearAmount);
    event GatewayOperatorUpdated(address indexed operator);

    error NotOwner();
    error LotNotFound();
    error NotCurator();
    error InvalidWindow();
    error AuctionClosed();
    error OutsideBiddingWindow();
    error SaltAlreadyUsed();
    error BidAlreadySubmitted();
    error EmptySalt();
    error GatewayNotConfigured();
    error RevealAlreadyRequested();
    error RevealNotRequested();
    error UnauthorizedGateway();
    error AuctionNotClosed();
    error AlreadySettled();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier lotExists(uint256 lotId) {
        if (_lots[lotId].curator == address(0)) {
            revert LotNotFound();
        }
        _;
    }

    modifier onlyCurator(uint256 lotId) {
        if (_lots[lotId].curator != msg.sender) {
            revert NotCurator();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Create a new blind bid lot with encrypted reserve price.
    /// @param metadataURI Off-chain metadata reference for the lot.
    /// @param startTime UNIX timestamp when bidding opens.
    /// @param endTime UNIX timestamp when bidding closes.
    /// @param encryptedReserve Encrypted reserve threshold provided by curator.
    /// @param reserveProof Zero-knowledge proof for the encrypted reserve value.
    /// @return lotId Newly created lot identifier.
    function createLot(
        string calldata metadataURI,
        uint64 startTime,
        uint64 endTime,
        externalEuint64 encryptedReserve,
        bytes calldata reserveProof
    ) external returns (uint256 lotId) {
        if (endTime <= startTime || endTime <= block.timestamp) {
            revert InvalidWindow();
        }

        lotId = _nextLotId++;
        Lot storage lot = _lots[lotId];
        lot.curator = msg.sender;
        lot.startTime = startTime;
        lot.endTime = endTime;
        lot.metadataURI = metadataURI;

        euint64 reserve = FHE.fromExternal(encryptedReserve, reserveProof);
        lot.encryptedReserve = reserve;
        FHE.allowThis(lot.encryptedReserve);
        FHE.allow(lot.encryptedReserve, msg.sender);
        if (gatewayOperator != address(0)) {
            FHE.allow(lot.encryptedReserve, gatewayOperator);
        }

        lot.encryptedWinningBid = FHE.asEuint64(0);
        FHE.allowThis(lot.encryptedWinningBid);
        FHE.allow(lot.encryptedWinningBid, msg.sender);
        if (gatewayOperator != address(0)) {
            FHE.allow(lot.encryptedWinningBid, gatewayOperator);
        }

        lot.encryptedWinningIndex = FHE.asEuint32(0);
        FHE.allowThis(lot.encryptedWinningIndex);
        FHE.allow(lot.encryptedWinningIndex, msg.sender);
        if (gatewayOperator != address(0)) {
            FHE.allow(lot.encryptedWinningIndex, gatewayOperator);
        }

        _lotIds.push(lotId);
        emit LotCreated(lotId, msg.sender, startTime, endTime, metadataURI);
    }

    /// @notice Submit a sealed bid for a lot with salted commitment.
    /// @param lotId Target lot identifier.
    /// @param encryptedBid Bid ciphertext generated in the frontend.
    /// @param inputProof Proof used to import the encrypted bid.
    /// @param saltHash Commitment hash preventing replay attacks.
    function submitBid(
        uint256 lotId,
        externalEuint64 encryptedBid,
        bytes calldata inputProof,
        bytes32 saltHash
    ) external lotExists(lotId) {
        if (saltHash == bytes32(0)) {
            revert EmptySalt();
        }
        Lot storage lot = _lots[lotId];
        if (lot.closed) {
            revert AuctionClosed();
        }
        if (block.timestamp < lot.startTime || block.timestamp > lot.endTime) {
            revert OutsideBiddingWindow();
        }
        if (_saltRegistry[lotId][saltHash]) {
            revert SaltAlreadyUsed();
        }
        if (_bids[lotId][msg.sender].saltHash != bytes32(0)) {
            revert BidAlreadySubmitted();
        }

        _saltRegistry[lotId][saltHash] = true;
        euint64 bidAmount = FHE.fromExternal(encryptedBid, inputProof);
        FHE.allowThis(bidAmount);
        FHE.allow(bidAmount, msg.sender);
        if (gatewayOperator != address(0)) {
            FHE.allow(bidAmount, gatewayOperator);
        }

        uint32 bidIndex = lot.bidCount;
        lot.bidCount = bidIndex + 1;

        BidEnvelope storage envelope = _bids[lotId][msg.sender];
        envelope.amount = bidAmount;
        envelope.saltHash = saltHash;
        envelope.submittedAt = uint64(block.timestamp);
        envelope.index = bidIndex;
        envelope.isSealed = false;

        _indexToBidder[lotId][bidIndex] = msg.sender;
        _lotParticipants[lotId].push(msg.sender);

        if (bidIndex == 0) {
            lot.encryptedWinningBid = bidAmount;
            lot.encryptedWinningIndex = FHE.asEuint32(bidIndex);
        } else {
            ebool isHigher = FHE.gt(bidAmount, lot.encryptedWinningBid);
            lot.encryptedWinningBid = FHE.select(isHigher, bidAmount, lot.encryptedWinningBid);
            lot.encryptedWinningIndex = FHE.select(
                isHigher,
                FHE.asEuint32(bidIndex),
                lot.encryptedWinningIndex
            );
        }

        FHE.allowThis(lot.encryptedWinningBid);
        FHE.allowThis(lot.encryptedWinningIndex);
        FHE.allow(lot.encryptedWinningBid, lot.curator);
        FHE.allow(lot.encryptedWinningIndex, lot.curator);
        if (gatewayOperator != address(0)) {
            FHE.allow(lot.encryptedWinningBid, gatewayOperator);
            FHE.allow(lot.encryptedWinningIndex, gatewayOperator);
        }

        emit BidSubmitted(lotId, msg.sender, bidIndex, saltHash);
    }

    /// @notice Close bidding and request reveal from the configured gateway.
    /// @param lotId Target lot identifier.
    function closeLot(uint256 lotId) external lotExists(lotId) onlyCurator(lotId) {
        Lot storage lot = _lots[lotId];
        if (lot.closed) {
            revert AuctionClosed();
        }
        if (gatewayOperator == address(0)) {
            revert GatewayNotConfigured();
        }
        if (lot.revealRequested) {
            revert RevealAlreadyRequested();
        }
        lot.closed = true;
        lot.revealRequested = true;

        address[] storage participants = _lotParticipants[lotId];
        for (uint256 i = 0; i < participants.length; i++) {
            _bids[lotId][participants[i]].isSealed = true;
        }

        emit LotClosed(lotId, msg.sender);
        emit RevealRequested(lotId, gatewayOperator);
    }

    /// @notice Gateway callback finalising reveal and settlement.
    /// @param lotId Target lot identifier.
    /// @param winningIndex Plain index returned by the gateway after decrypting.
    /// @param clearWinningBid Plain winning amount revealed by the gateway.
    /// @param bidder Winner address asserted by the gateway.
    function settleReveal(
        uint256 lotId,
        uint32 winningIndex,
        uint64 clearWinningBid,
        address bidder
    ) external lotExists(lotId) {
        if (msg.sender != gatewayOperator) {
            revert UnauthorizedGateway();
        }
        Lot storage lot = _lots[lotId];
        if (!lot.closed) {
            revert AuctionNotClosed();
        }
        if (lot.settled) {
            revert AlreadySettled();
        }
        if (!lot.revealRequested) {
            revert RevealNotRequested();
        }

        address recordedBidder = _indexToBidder[lotId][winningIndex];
        if (recordedBidder != bidder || recordedBidder == address(0)) {
            revert UnauthorizedGateway();
        }

        lot.winner = recordedBidder;
        lot.revealedAmount = clearWinningBid;
        lot.settled = true;

        emit RevealSettled(lotId, recordedBidder, clearWinningBid);
    }

    /// @notice Update the global gateway operator responsible for decryptions.
    /// @param newOperator Address of the relayer gateway.
    function updateGatewayOperator(address newOperator) external onlyOwner {
        gatewayOperator = newOperator;

        for (uint256 i = 0; i < _lotIds.length; i++) {
            Lot storage lot = _lots[_lotIds[i]];
            if (lot.curator == address(0)) {
                continue;
            }
            if (newOperator != address(0)) {
                FHE.allow(lot.encryptedReserve, newOperator);
                FHE.allow(lot.encryptedWinningBid, newOperator);
                FHE.allow(lot.encryptedWinningIndex, newOperator);
            }
        }

        emit GatewayOperatorUpdated(newOperator);
    }

    /// @notice Fetch public lot information without decrypting private values.
    function getLot(uint256 lotId) external view lotExists(lotId) returns (LotSnapshot memory snapshot) {
        Lot storage lot = _lots[lotId];
        snapshot.curator = lot.curator;
        snapshot.startTime = lot.startTime;
        snapshot.endTime = lot.endTime;
        snapshot.closed = lot.closed;
        snapshot.revealRequested = lot.revealRequested;
        snapshot.settled = lot.settled;
        snapshot.bidCount = lot.bidCount;
        snapshot.encryptedReserve = FHE.toBytes32(lot.encryptedReserve);
        snapshot.encryptedWinningBid = FHE.toBytes32(lot.encryptedWinningBid);
        snapshot.encryptedWinningIndex = FHE.toBytes32(lot.encryptedWinningIndex);
        snapshot.winner = lot.winner;
        snapshot.revealedAmount = lot.revealedAmount;
        snapshot.metadataURI = lot.metadataURI;
    }

    /// @notice Retrieve encrypted bid information for a participant.
    /// @param lotId Target lot identifier.
    /// @param bidder Address whose bid should be inspected.
    function getBid(uint256 lotId, address bidder)
        external
        view
        lotExists(lotId)
        returns (
            bytes32 encryptedAmount,
            bytes32 saltHash,
            uint64 submittedAt,
            uint32 index,
            bool isSealed
        )
    {
        Lot storage lot = _lots[lotId];
        if (msg.sender != bidder && msg.sender != lot.curator && msg.sender != owner) {
            revert NotCurator();
        }
        BidEnvelope storage envelope = _bids[lotId][bidder];
        return (
            FHE.toBytes32(envelope.amount),
            envelope.saltHash,
            envelope.submittedAt,
            envelope.index,
            envelope.isSealed
        );
    }

    /// @notice List all lot ids created so far.
    function getAllLotIds() external view returns (uint256[] memory) {
        return _lotIds;
    }
}
