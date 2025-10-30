const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Comprehensive test suite for BlindBidAuction contract.
 * Tests cover lot creation, encrypted bid submission, closing auctions,
 * and reveal settlement workflows following FHE best practices.
 */
describe("BlindBidAuction", function () {
  let blindBidAuction;
  let owner;
  let curator;
  let bidder1;
  let bidder2;
  let gatewayOperator;

  // Helper function to create mock encrypted input (simplified for testing)
  function createMockEncryptedInput(value) {
    // In real tests with fhEVM mock utils, you would use proper encryption
    // For now, we use a simple bytes32 representation
    return {
      data: ethers.keccak256(ethers.toUtf8Bytes(`encrypted_${value}`)),
      proof: ethers.keccak256(ethers.toUtf8Bytes(`proof_${value}`)),
    };
  }

  // Helper to create salt hash
  function createSaltHash(salt) {
    return ethers.keccak256(ethers.toUtf8Bytes(salt));
  }

  beforeEach(async function () {
    // Get signers
    [owner, curator, bidder1, bidder2, gatewayOperator] = await ethers.getSigners();

    // Deploy contract
    const BlindBidAuction = await ethers.getContractFactory("BlindBidAuction");
    blindBidAuction = await BlindBidAuction.deploy();
    await blindBidAuction.waitForDeployment();

    // Set gateway operator
    await blindBidAuction.connect(owner).updateGatewayOperator(gatewayOperator.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await blindBidAuction.owner()).to.equal(owner.address);
    });

    it("Should set the gateway operator", async function () {
      expect(await blindBidAuction.gatewayOperator()).to.equal(gatewayOperator.address);
    });

    it("Should start with lotId counter at 1", async function () {
      const lotIds = await blindBidAuction.getAllLotIds();
      expect(lotIds.length).to.equal(0);
    });
  });

  describe("Lot Creation", function () {
    it("Should create a new lot with encrypted reserve", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600; // 1 hour from now
      const endTime = startTime + 86400; // 24 hours duration

      const mockReserve = createMockEncryptedInput(1000);

      const tx = await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://Qm...",
          startTime,
          endTime,
          mockReserve.data,
          mockReserve.proof
        );

      await expect(tx)
        .to.emit(blindBidAuction, "LotCreated")
        .withArgs(1, curator.address, startTime, endTime, "ipfs://Qm...");

      const lot = await blindBidAuction.getLot(1);
      expect(lot.curator).to.equal(curator.address);
      expect(lot.startTime).to.equal(startTime);
      expect(lot.endTime).to.equal(endTime);
      expect(lot.closed).to.equal(false);
      expect(lot.bidCount).to.equal(0);
    });

    it("Should reject lot creation with invalid time window", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime - 1000; // End before start

      const mockReserve = createMockEncryptedInput(1000);

      await expect(
        blindBidAuction
          .connect(curator)
          .createLot("ipfs://Qm...", startTime, endTime, mockReserve.data, mockReserve.proof)
      ).to.be.revertedWithCustomError(blindBidAuction, "InvalidWindow");
    });

    it("Should allow multiple lots to be created", async function () {
      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);

      await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot1",
          currentTime + 3600,
          currentTime + 90000,
          mockReserve.data,
          mockReserve.proof
        );

      await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot2",
          currentTime + 3600,
          currentTime + 90000,
          mockReserve.data,
          mockReserve.proof
        );

      const lotIds = await blindBidAuction.getAllLotIds();
      expect(lotIds.length).to.equal(2);
      expect(lotIds[0]).to.equal(1n);
      expect(lotIds[1]).to.equal(2n);
    });
  });

  describe("Bid Submission", function () {
    let lotId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      const currentTime = await time.latest();
      startTime = currentTime + 100;
      endTime = startTime + 3600;

      const mockReserve = createMockEncryptedInput(1000);
      const tx = await blindBidAuction
        .connect(curator)
        .createLot("ipfs://lot", startTime, endTime, mockReserve.data, mockReserve.proof);

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return blindBidAuction.interface.parseLog(log).name === "LotCreated";
        } catch {
          return false;
        }
      });
      lotId = blindBidAuction.interface.parseLog(event).args.lotId;
    });

    it("Should submit encrypted bid during bidding window", async function () {
      await time.increaseTo(startTime + 10);

      const mockBid = createMockEncryptedInput(2000);
      const saltHash = createSaltHash("random_salt_123");

      const tx = await blindBidAuction
        .connect(bidder1)
        .submitBid(lotId, mockBid.data, mockBid.proof, saltHash);

      await expect(tx)
        .to.emit(blindBidAuction, "BidSubmitted")
        .withArgs(lotId, bidder1.address, 0, saltHash);

      const lot = await blindBidAuction.getLot(lotId);
      expect(lot.bidCount).to.equal(1);
    });

    it("Should reject bid before bidding window opens", async function () {
      const mockBid = createMockEncryptedInput(2000);
      const saltHash = createSaltHash("salt");

      await expect(
        blindBidAuction.connect(bidder1).submitBid(lotId, mockBid.data, mockBid.proof, saltHash)
      ).to.be.revertedWithCustomError(blindBidAuction, "OutsideBiddingWindow");
    });

    it("Should reject bid after bidding window closes", async function () {
      await time.increaseTo(endTime + 10);

      const mockBid = createMockEncryptedInput(2000);
      const saltHash = createSaltHash("salt");

      await expect(
        blindBidAuction.connect(bidder1).submitBid(lotId, mockBid.data, mockBid.proof, saltHash)
      ).to.be.revertedWithCustomError(blindBidAuction, "OutsideBiddingWindow");
    });

    it("Should reject duplicate salt hash", async function () {
      await time.increaseTo(startTime + 10);

      const mockBid1 = createMockEncryptedInput(2000);
      const saltHash = createSaltHash("same_salt");

      await blindBidAuction.connect(bidder1).submitBid(lotId, mockBid1.data, mockBid1.proof, saltHash);

      const mockBid2 = createMockEncryptedInput(3000);

      await expect(
        blindBidAuction.connect(bidder2).submitBid(lotId, mockBid2.data, mockBid2.proof, saltHash)
      ).to.be.revertedWithCustomError(blindBidAuction, "SaltAlreadyUsed");
    });

    it("Should reject empty salt hash", async function () {
      await time.increaseTo(startTime + 10);

      const mockBid = createMockEncryptedInput(2000);
      const emptySalt = ethers.ZeroHash;

      await expect(
        blindBidAuction.connect(bidder1).submitBid(lotId, mockBid.data, mockBid.proof, emptySalt)
      ).to.be.revertedWithCustomError(blindBidAuction, "EmptySalt");
    });

    it("Should reject duplicate bid from same bidder", async function () {
      await time.increaseTo(startTime + 10);

      const mockBid1 = createMockEncryptedInput(2000);
      const saltHash1 = createSaltHash("salt1");
      await blindBidAuction.connect(bidder1).submitBid(lotId, mockBid1.data, mockBid1.proof, saltHash1);

      const mockBid2 = createMockEncryptedInput(3000);
      const saltHash2 = createSaltHash("salt2");

      await expect(
        blindBidAuction.connect(bidder1).submitBid(lotId, mockBid2.data, mockBid2.proof, saltHash2)
      ).to.be.revertedWithCustomError(blindBidAuction, "BidAlreadySubmitted");
    });

    it("Should accept multiple bids from different bidders", async function () {
      await time.increaseTo(startTime + 10);

      const mockBid1 = createMockEncryptedInput(2000);
      const saltHash1 = createSaltHash("salt1");
      await blindBidAuction.connect(bidder1).submitBid(lotId, mockBid1.data, mockBid1.proof, saltHash1);

      const mockBid2 = createMockEncryptedInput(3000);
      const saltHash2 = createSaltHash("salt2");
      await blindBidAuction.connect(bidder2).submitBid(lotId, mockBid2.data, mockBid2.proof, saltHash2);

      const lot = await blindBidAuction.getLot(lotId);
      expect(lot.bidCount).to.equal(2);
    });
  });

  describe("Lot Closing", function () {
    let lotId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);

      const tx = await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return blindBidAuction.interface.parseLog(log).name === "LotCreated";
        } catch {
          return false;
        }
      });
      lotId = blindBidAuction.interface.parseLog(event).args.lotId;
    });

    it("Should allow curator to close lot", async function () {
      const tx = await blindBidAuction.connect(curator).closeLot(lotId);

      await expect(tx).to.emit(blindBidAuction, "LotClosed").withArgs(lotId, curator.address);

      await expect(tx).to.emit(blindBidAuction, "RevealRequested").withArgs(lotId, gatewayOperator.address);

      const lot = await blindBidAuction.getLot(lotId);
      expect(lot.closed).to.equal(true);
      expect(lot.revealRequested).to.equal(true);
    });

    it("Should reject close from non-curator", async function () {
      await expect(blindBidAuction.connect(bidder1).closeLot(lotId)).to.be.revertedWithCustomError(
        blindBidAuction,
        "NotCurator"
      );
    });

    it("Should reject double close", async function () {
      await blindBidAuction.connect(curator).closeLot(lotId);

      await expect(blindBidAuction.connect(curator).closeLot(lotId)).to.be.revertedWithCustomError(
        blindBidAuction,
        "AuctionClosed"
      );
    });

    it("Should reject close when gateway not configured", async function () {
      // Deploy new contract without gateway
      const BlindBidAuction = await ethers.getContractFactory("BlindBidAuction");
      const newContract = await BlindBidAuction.deploy();
      await newContract.waitForDeployment();

      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);
      const tx = await newContract
        .connect(curator)
        .createLot(
          "ipfs://lot",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return newContract.interface.parseLog(log).name === "LotCreated";
        } catch {
          return false;
        }
      });
      const newLotId = newContract.interface.parseLog(event).args.lotId;

      await expect(newContract.connect(curator).closeLot(newLotId)).to.be.revertedWithCustomError(
        newContract,
        "GatewayNotConfigured"
      );
    });
  });

  describe("Reveal Settlement", function () {
    let lotId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);

      const tx = await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return blindBidAuction.interface.parseLog(log).name === "LotCreated";
        } catch {
          return false;
        }
      });
      lotId = blindBidAuction.interface.parseLog(event).args.lotId;

      await time.increaseTo(currentTime + 150);

      const mockBid = createMockEncryptedInput(2000);
      const saltHash = createSaltHash("winner_salt");
      await blindBidAuction.connect(bidder1).submitBid(lotId, mockBid.data, mockBid.proof, saltHash);

      await blindBidAuction.connect(curator).closeLot(lotId);
    });

    it("Should allow gateway to settle reveal", async function () {
      const winningIndex = 0;
      const clearWinningBid = 2000;

      const tx = await blindBidAuction
        .connect(gatewayOperator)
        .settleReveal(lotId, winningIndex, clearWinningBid, bidder1.address);

      await expect(tx)
        .to.emit(blindBidAuction, "RevealSettled")
        .withArgs(lotId, bidder1.address, clearWinningBid);

      const lot = await blindBidAuction.getLot(lotId);
      expect(lot.settled).to.equal(true);
      expect(lot.winner).to.equal(bidder1.address);
      expect(lot.revealedAmount).to.equal(clearWinningBid);
    });

    it("Should reject settlement from non-gateway", async function () {
      await expect(
        blindBidAuction.connect(bidder1).settleReveal(lotId, 0, 2000, bidder1.address)
      ).to.be.revertedWithCustomError(blindBidAuction, "UnauthorizedGateway");
    });

    it("Should reject settlement for non-closed auction", async function () {
      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);

      const tx = await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot2",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return blindBidAuction.interface.parseLog(log).name === "LotCreated";
        } catch {
          return false;
        }
      });
      const newLotId = blindBidAuction.interface.parseLog(event).args.lotId;

      await expect(
        blindBidAuction.connect(gatewayOperator).settleReveal(newLotId, 0, 2000, bidder1.address)
      ).to.be.revertedWithCustomError(blindBidAuction, "AuctionNotClosed");
    });

    it("Should reject double settlement", async function () {
      await blindBidAuction.connect(gatewayOperator).settleReveal(lotId, 0, 2000, bidder1.address);

      await expect(
        blindBidAuction.connect(gatewayOperator).settleReveal(lotId, 0, 2000, bidder1.address)
      ).to.be.revertedWithCustomError(blindBidAuction, "AlreadySettled");
    });
  });

  describe("Gateway Operator Management", function () {
    it("Should allow owner to update gateway operator", async function () {
      const [, , , , newOperator] = await ethers.getSigners();

      const tx = await blindBidAuction.connect(owner).updateGatewayOperator(newOperator.address);

      await expect(tx).to.emit(blindBidAuction, "GatewayOperatorUpdated").withArgs(newOperator.address);

      expect(await blindBidAuction.gatewayOperator()).to.equal(newOperator.address);
    });

    it("Should reject gateway update from non-owner", async function () {
      const [, , , , newOperator] = await ethers.getSigners();

      await expect(
        blindBidAuction.connect(curator).updateGatewayOperator(newOperator.address)
      ).to.be.revertedWithCustomError(blindBidAuction, "NotOwner");
    });
  });

  describe("View Functions", function () {
    it("Should return all lot IDs", async function () {
      const currentTime = await time.latest();
      const mockReserve = createMockEncryptedInput(1000);

      await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot1",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      await blindBidAuction
        .connect(curator)
        .createLot(
          "ipfs://lot2",
          currentTime + 100,
          currentTime + 3600,
          mockReserve.data,
          mockReserve.proof
        );

      const lotIds = await blindBidAuction.getAllLotIds();
      expect(lotIds.length).to.equal(2);
    });

    it("Should revert when getting non-existent lot", async function () {
      await expect(blindBidAuction.getLot(999)).to.be.revertedWithCustomError(
        blindBidAuction,
        "LotNotFound"
      );
    });
  });
});
