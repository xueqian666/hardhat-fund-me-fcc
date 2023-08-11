require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("dotenv").config()
require("hardhat-gas-reporter")
require("solidity-coverage")


const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          chainId: 31337,
          // gasPrice: 130000000000,
      },
      sepolia: {
          url: SEPOLIA_RPC_URL,
          accounts: [PRIVATE_KEY],
          chainId: 11155111,
          //wait 6 blocks
          blockConfirmations: 6,
      },
  },
  etherscan: {
      apiKey: ETHERSCAN_API_KEY,
      // customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
  },
  gasReporter: {
      enabled: true,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
      // coinmarketcap: COINMARKETCAP_API_KEY,
      token: "MATIC"
  },
  namedAccounts: {
      deployer: {
          default: 0, // here this will by default take the first account as deployer
          1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      },
  },
  mocha: {
      timeout: 500000,
  }
};
