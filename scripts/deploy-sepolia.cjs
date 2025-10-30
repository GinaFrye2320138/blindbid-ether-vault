#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

/**
 * Deploy BlindBidAuction to Sepolia.
 * This script enforces fail-closed behavior by requiring all sensitive
 * environment variables prior to broadcasting any transaction.
 */
async function main() {
  const requiredEnv = ["DEPLOYER_PRIVATE_KEY", "SEPOLIA_RPC_URL"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log(`🚀 Deploying BlindBidAuction from ${deployer.address} on ${network.name}`);

  const factory = await ethers.getContractFactory("BlindBidAuction", deployer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ BlindBidAuction deployed at: ${contractAddress}`);

  // Persist deployment metadata for future scripts.
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const deploymentRecord = {
    address: contractAddress,
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  fs.writeFileSync(
    path.join(deploymentsDir, `BlindBidAuction-${network.name}.json`),
    JSON.stringify(deploymentRecord, null, 2),
  );

  // Copy ABI for frontend consumption.
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BlindBidAuction.sol",
    "BlindBidAuction.json",
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Compile before deploying.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const abiDir = path.join(__dirname, "..", "src", "abi");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(path.join(abiDir, "BlindBidAuction.json"), JSON.stringify(artifact.abi, null, 2));
  console.log(`📦 ABI exported to src/abi/BlindBidAuction.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
