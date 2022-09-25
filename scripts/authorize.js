//to run this on testnet:
// $ npx hardhat run scripts/authorize.js

const fs = require('fs')
const path = require('path')
const hardhat = require('hardhat')
const authorize = require('../data/authorize.json') 

function genesisMint(recipient, quantity = 1) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256'],
      ['freemint', recipient, quantity]
    ).slice(2),
    'hex'
  )
}

function whitelistMint(recipient, price = '10000000000000000000') {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256'],
      ['wlmint', recipient, price]
    ).slice(2),
    'hex'
  )
}

function publicMint(price = '15000000000000000000') {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'uint256'],
      ['publicmint', price]
    ).slice(2),
    'hex'
  )
}

async function main() {
  //sign message wallet PK
  const wallet = hardhat.config.networks[hardhat.config.defaultNetwork].accounts[0]
  const signer = new ethers.Wallet(wallet)

  const start = 10
  const chunk = 2
  const authorized = {}

  for (let i = 0; i < authorize.genesis.length; i++) {
    const [ address, quantity ] = authorize.genesis[i]
    const message = genesisMint(address, quantity)
    const proof = await signer.signMessage(message)
    const key = address.substring(start, start + chunk).toLowerCase()
    if (!authorized[key]) authorized[key] = {}
    if (!authorized[key][address.toLowerCase()]) {
      authorized[key][address.toLowerCase()] = {}
    }
    authorized[key][address.toLowerCase()].genesis = {
      method: 'mint(address,uint256,bytes)',
      args: { quantity, proof }
    }
      
  }

  for (let j = 0; j < authorize.stacked.length; j++) {
    const [ address, ethPrice ] = authorize.stacked[j]
    const price = ethers.utils.parseEther(String(ethPrice)).toString()
    const message = whitelistMint(address, price)
    const proof = await signer.signMessage(message)
    const key = address.substring(start, start + chunk).toLowerCase()
    if (!authorized[key]) authorized[key] = {}
    if (!authorized[key][address.toLowerCase()]) {
      authorized[key][address.toLowerCase()] = {}
    }

    authorized[key][address.toLowerCase()].stacked = {
      method: 'mint(address,uint256,uint256,bytes)',
      args: { price, proof }
    }
  }

  for (let k = 0; k < authorize.whitelist.length; k++) {
    const [ address, ethPrice ] = authorize.whitelist[k]
    const price = ethers.utils.parseEther(String(ethPrice)).toString()
    const message = whitelistMint(address, price)
    const proof = await signer.signMessage(message)
    const key = address.substring(start, start + chunk).toLowerCase()
    if (!authorized[key]) authorized[key] = {}
    if (!authorized[key][address.toLowerCase()]) {
      authorized[key][address.toLowerCase()] = {}
    }
    authorized[key][address.toLowerCase()].whitelist = {
      method: 'mint(address,uint256,uint256,bytes)',
      args: { price, proof }
    }
  }

  for (const key in authorized) {
    fs.writeFileSync(
      path.resolve(__dirname, `../docs/data/authorized/${key}.json`),
      JSON.stringify(authorized[key], null, 2)
    )
  }

  console.log(
    'public proof', 
    '15000000000000000000', 
    await signer.signMessage(publicMint('15000000000000000000'))
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
