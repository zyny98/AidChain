import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Helper: ensure private key has 0x prefix
// ---------------------------------------------------------------------------
function pk(raw: string | undefined): string {
  if (!raw) {
    // Return a dummy key so compilation works even without .env
    return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

const DEPLOYER_KEY = pk(process.env.DEPLOYER_PRIVATE_KEY);
const ORACLE_KEY = pk(process.env.ORACLE_PRIVATE_KEY);
const AMOY_RPC = process.env.AMOY_RPC_URL ?? "https://rpc-amoy.polygon.technology";
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  // -------------------------------------------------------------------------
  // Solidity compiler settings
  // -------------------------------------------------------------------------
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  // -------------------------------------------------------------------------
  // Networks
  // -------------------------------------------------------------------------
  networks: {
    // Local Hardhat node (used for tests and local dev)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Hardhat in-process network (default for `hardhat test`)
    hardhat: {
      chainId: 31337,
      // Give the first 10 accounts 10 000 ETH for testing
      accounts: {
        count: 10,
        accountsBalance: "10000000000000000000000", // 10 000 ETH
      },
    },

    // Polygon Amoy testnet
    amoy: {
      url: AMOY_RPC,
      chainId: 80002,
      accounts: [DEPLOYER_KEY, ORACLE_KEY],
      gasPrice: "auto",
    },
  },

  // -------------------------------------------------------------------------
  // Etherscan / Polygonscan verification
  // -------------------------------------------------------------------------
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Gas reporter (activated with REPORT_GAS=true env variable)
  // -------------------------------------------------------------------------
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  // -------------------------------------------------------------------------
  // TypeScript paths
  // -------------------------------------------------------------------------
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
