#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

/**
 * Verify the BlindBidAuction contract on Sepolia Etherscan.
 * Reads the deployment record produced by deploy-sepolia.cjs.
 */
async function main() {
  const requiredEnv = ["ETHERSCAN_API_KEY", "SEPOLIA_RPC_URL"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const deploymentPath = path.join(__dirname, "..", "deployments", "BlindBidAuction-sepolia.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment record not found at ${deploymentPath}. Deploy first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  if (!deployment.address) {
    throw new Error(`Deployment record missing address field: ${deploymentPath}`);
  }

  console.log(`🔎 Verifying BlindBidAuction at ${deployment.address} on ${hre.network.name}`);
  await hre.run("verify:verify", {
    address: deployment.address,
    constructorArguments: [],
  });

  console.log("✅ Verification submitted to Etherscan.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
