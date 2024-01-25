import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 10_000_000,
      },
    },
  },

  networks: {
    gnosis: {
      url: "https://rpc.ankr.com/gnosis",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    // sepolia: {
    //   //
    // },
    // mainnet: {
    //   //
    // },
  },
  namedAccounts: {
    deployer: { default: 0 },
    agent: {
      gnosis: "0x071412e301C2087A4DAA055CF4aFa2683cE1e499",
      mainnet: "0xc9ce4CdA5897707546F3904C0FfCC6e429bC4546",
      sepolia: "0xbdE2Aed54521000DC033B67FB522034e0F93A7e5",
    },
  },
  etherscan: {
    apiKey: process.env.GNOSISSCAN_API_KEY,
  },
};

export default config;
