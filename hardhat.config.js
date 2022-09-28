require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: process.env.BLOCKCHAIN_NETWORK,
  networks: {
    hardhat: {
      chainId: 1337,
      mining: {
        //set this to false if you want localhost to mimick a real blockchain
        auto: true,
        interval: 5000
      }
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      chainId: 80001,
      scanner: 'https://mumbai.polygonscan.com',
      opensea: 'https://opensea.io',
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887',
      accounts: [process.env.BLOCKCHAIN_MUMBAI_PRIVATE_KEY],
      contracts: {
        nft: '0x8DcEDa29112D216DB500974EBA35C0262ec1cAc8'
      }
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      scanner: 'https://polygonscan.com',
      opensea: 'https://opensea.io',
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887', 
      accounts: [process.env.BLOCKCHAIN_POLYGON_PRIVATE_KEY],
      contracts: {
        nft: '0xd581cbaBE1e603838AD1D29cb4df31FdC24ebd2E'
      }
    }
  },
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 20000
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.BLOCKCHAIN_CMC_KEY,
    gasPrice: 50
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BLOCKCHAIN_SCANNER_KEY
  },
  contractSizer: {
    //see: https://www.npmjs.com/package/hardhat-contract-sizer
    runOnCompile: true
  }
};
