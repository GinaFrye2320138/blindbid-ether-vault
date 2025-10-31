require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");

/**
 * Script to create a new auction lot on BlindBid
 *
 * Usage:
 *   node scripts/create-auction.cjs
 *
 * Or with custom parameters:
 *   METADATA_URI="ipfs://..." RESERVE_PRICE=1.5 DURATION_HOURS=24 node scripts/create-auction.cjs
 */

async function main() {
  console.log("🎨 Creating new BlindBid auction...\n");

  // Get contract address
  const contractAddress = process.env.VITE_APP_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("VITE_APP_CONTRACT_ADDRESS not set in .env");
  }

  // Get deployer/curator account
  const [curator] = await hre.ethers.getSigners();
  console.log(`📝 Curator address: ${curator.address}`);
  console.log(`💰 Curator balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(curator.address))} ETH\n`);

  // Load contract
  const BlindBidAuction = await hre.ethers.getContractFactory("BlindBidAuction");
  const auction = BlindBidAuction.attach(contractAddress);

  // Auction parameters
  const metadataURI = process.env.METADATA_URI || "ipfs://QmExample123/metadata.json";
  const reservePriceEth = process.env.RESERVE_PRICE || "0.1"; // 0.1 ETH default
  const durationHours = parseInt(process.env.DURATION_HOURS || "24"); // 24 hours default

  // Calculate timestamps
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 60; // Start in 1 minute
  const endTime = startTime + (durationHours * 60 * 60);

  console.log("📋 Auction Details:");
  console.log(`   Metadata URI: ${metadataURI}`);
  console.log(`   Reserve Price: ${reservePriceEth} ETH`);
  console.log(`   Start Time: ${new Date(startTime * 1000).toLocaleString()}`);
  console.log(`   End Time: ${new Date(endTime * 1000).toLocaleString()}`);
  console.log(`   Duration: ${durationHours} hours\n`);

  // Encrypt reserve price using FHE SDK
  console.log("🔐 Encrypting reserve price with FHE SDK...");
  const reservePriceWei = hre.ethers.parseEther(reservePriceEth);

  // Initialize FHE SDK for server-side encryption
  const { createInstance, initSDK, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/bundle");

  // Initialize SDK with minimal thread count for server
  await initSDK({ thread: 1 });

  // Create FHE instance for Sepolia
  const fheInstance = await createInstance({
    ...SepoliaConfig,
    network: process.env.SEPOLIA_RPC_URL,
    relayerUrl: process.env.VITE_APP_RELAYER_URL || "https://relayer.sepolia.zama.ai",
  });

  // Create encrypted input for the contract
  const encryptedInput = fheInstance.createEncryptedInput(contractAddress, curator.address);
  encryptedInput.add64(reservePriceWei);

  // Generate ciphertext and proof
  const result = await encryptedInput.encrypt();

  if (!result.handles || result.handles.length === 0) {
    throw new Error("Failed to encrypt reserve price");
  }

  // Convert binary to hex
  const encryptedReserve = "0x" + Buffer.from(result.handles[0]).toString("hex");
  const reserveProof = "0x" + Buffer.from(result.inputProof).toString("hex");

  try {
    console.log("📤 Submitting transaction...");
    const tx = await auction.createLot(
      metadataURI,
      startTime,
      endTime,
      encryptedReserve,
      reserveProof
    );

    console.log(`⏳ Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Extract lot ID from events
    const createEvent = receipt.logs.find(log => {
      try {
        return auction.interface.parseLog(log)?.name === "LotCreated";
      } catch {
        return false;
      }
    });

    if (createEvent) {
      const parsedLog = auction.interface.parseLog(createEvent);
      const lotId = parsedLog.args[0];
      console.log(`\n🎉 Auction created successfully!`);
      console.log(`📦 Lot ID: ${lotId}`);
      console.log(`🔗 View on Sepolia Etherscan:`);
      console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
    }

  } catch (error) {
    console.error("\n❌ Error creating auction:");
    console.error(error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
