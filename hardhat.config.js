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
        usdc: '0x8F54a342Fb4327C8D85Ea86A9322713eA80E040c',
        nft: '0xb416c77F0728EEe9089DdfCc6CCB4b9Cb2575294',
        metadata: '0xfa08Ad07929b9F21DF3050135a0c6590885471e5',
        sale: '0x6dE9c79560b0E449E1b3D4C2445Bd416A869731E',
        index: '0x997AD53E22a1b1fC3E519dd6709D9701447B0E2A',
        store: '0xF3Ff0a21bB57B445f41B2242A9D1fCB66c491D2f'
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
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        nft: '0xdE2269159b74E49b3C14E16BE59F49C404Bb642F',
        metadata: '0xc7F0c5fE8E013C1E0d9137814EE9C8fE11A831Dc',
        sale: '0x3578888c7bC7D10deFC550400dadB0E1B406A522',
        index: '0xA39eaD14E85E706ac63B2DB1f7a46e0036530cA6',
        store: '0x8d67b4CEA2756FCb9B7b64513762065B89281707',
        splitter: '0x7C1B2d95fe7dcD00cf8e6248ee6093B38C5e6B70'
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
    gasPrice: 20
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
