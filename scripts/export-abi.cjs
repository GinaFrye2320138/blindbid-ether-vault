#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Export the BlindBidAuction ABI into src/abi for frontend usage.
 */
function main() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BlindBidAuction.sol",
    "BlindBidAuction.json",
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Compile contracts first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiOutputDir = path.join(__dirname, "..", "src", "abi");
  fs.mkdirSync(abiOutputDir, { recursive: true });
  const abiPath = path.join(abiOutputDir, "BlindBidAuction.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));

  console.log(`ABI exported to ${abiPath}`);
}

try {
  main();
  process.exit(0);
} catch (error) {
  console.error("Failed to export ABI:", error);
  process.exit(1);
}
