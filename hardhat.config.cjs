"use strict";

const path = require("path");

process.env.TS_NODE_PROJECT = path.resolve(__dirname, "tsconfig.hardhat.json");
require("ts-node").register({
  files: true,
  project: process.env.TS_NODE_PROJECT,
});

require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");

/**
 * Hardhat configuration for the BlindBid project.
 * - Solidity pinned at v0.8.24 to align with fhEVM compatibility.
 * - Sepolia network uses environment variables for sensitive values.
 * - FHE plugin enabled to compile encrypted types and generate ACL artifacts.
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: process.env.SEPOLIA_GAS_PRICE ? Number(process.env.SEPOLIA_GAS_PRICE) : undefined,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  sourcify: {
    enabled: false,
  },
  fhevm: {
    network: "sepolia",
    aclManager: process.env.FHE_ACL_MANAGER || undefined,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    scripts: "./scripts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
