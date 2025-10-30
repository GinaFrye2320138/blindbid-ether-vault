const { expect } = require("chai");
const hre = require("hardhat");

describe("BlindBidAuction", () => {
  const METADATA_URI = "ipfs://blind-bid-demo";
  let contract;
  let owner;
  let curator;
  let bidder;
  let gateway;

  const scheduleWindow = async () => {
    const block = await hre.ethers.provider.getBlock("latest");
    const start = Number(block.timestamp) + 60;
    return { start, end: start + 3600 };
  };

  const advanceTo = async (timestamp) => {
    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await hre.ethers.provider.send("evm_mine", []);
  };

  async function encrypt64(forSigner, value) {
    const input = hre.fhevm.createEncryptedInput(await contract.getAddress(), forSigner.address);
    input.add64(BigInt(value));
    return input.encrypt();
  }

  beforeEach(async () => {
    [owner, curator, bidder, gateway] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContractFactory("BlindBidAuction", owner);
    contract = await factory.deploy();
    await contract.waitForDeployment();

    await hre.fhevm.assertCoprocessorInitialized(contract, "BlindBidAuction");
  });

  it("creates a lot with encrypted reserve", async () => {
    const { start: startTime, end: endTime } = await scheduleWindow();
    const reserve = await encrypt64(curator, 100n);

    await expect(
      contract
        .connect(curator)
        .createLot(METADATA_URI, startTime, endTime, reserve.handles[0], reserve.inputProof),
    )
      .to.emit(contract, "LotCreated")
      .withArgs(1, curator.address, startTime, endTime, METADATA_URI);

    const lotSnapshot = await contract.getLot(1);
    expect(lotSnapshot.curator).to.equal(curator.address);
    expect(lotSnapshot.bidCount).to.equal(0);
  });

  it("accepts encrypted bids and tracks winners", async () => {
    const { start: startTime, end: endTime } = await scheduleWindow();
    const reserve = await encrypt64(curator, 50n);
    await contract
      .connect(curator)
      .createLot(METADATA_URI, startTime, endTime, reserve.handles[0], reserve.inputProof);

    await advanceTo(startTime + 1);

    const bidCipher = await encrypt64(bidder, 75n);
    const salt = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bid-salt"));

    await expect(
      contract.connect(bidder).submitBid(1, bidCipher.handles[0], bidCipher.inputProof, salt),
    )
      .to.emit(contract, "BidSubmitted")
      .withArgs(1, bidder.address, 0, salt);

    const lotSnapshot = await contract.getLot(1);
    expect(lotSnapshot.bidCount).to.equal(1);
  });

  it("enforces gateway configuration before closing", async () => {
    const { start: startTime, end: endTime } = await scheduleWindow();
    const reserve = await encrypt64(curator, 10n);
    await contract
      .connect(curator)
      .createLot(METADATA_URI, startTime, endTime, reserve.handles[0], reserve.inputProof);

    await advanceTo(startTime + 1);

    const bidCipher = await encrypt64(bidder, 20n);
    const salt = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("salt"));
    await contract.connect(bidder).submitBid(1, bidCipher.handles[0], bidCipher.inputProof, salt);

    await expect(contract.connect(curator).closeLot(1)).to.be.revertedWithCustomError(
      contract,
      "GatewayNotConfigured",
    );

    await contract.connect(owner).updateGatewayOperator(gateway.address);

    await expect(contract.connect(curator).closeLot(1))
      .to.emit(contract, "LotClosed")
      .withArgs(1, curator.address);
  });

  it("settles reveal via gateway callback", async () => {
    const { start: startTime, end: endTime } = await scheduleWindow();
    const reserve = await encrypt64(curator, 30n);
    await contract
      .connect(curator)
      .createLot(METADATA_URI, startTime, endTime, reserve.handles[0], reserve.inputProof);

    await advanceTo(startTime + 1);

    const bidCipher = await encrypt64(bidder, 40n);
    const salt = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("gateway"));
    await contract.connect(bidder).submitBid(1, bidCipher.handles[0], bidCipher.inputProof, salt);

    await contract.connect(owner).updateGatewayOperator(gateway.address);
    await contract.connect(curator).closeLot(1);

    await expect(contract.connect(gateway).settleReveal(1, 0, 40n, bidder.address))
      .to.emit(contract, "RevealSettled")
      .withArgs(1, bidder.address, 40n);

    const lotSnapshot = await contract.getLot(1);
    expect(lotSnapshot.settled).to.equal(true);
    expect(lotSnapshot.winner).to.equal(bidder.address);
  });
});
