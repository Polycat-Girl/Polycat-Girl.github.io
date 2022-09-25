const { expect, deploy, bindContract, getRole } = require('./utils');

function freeMint(recipient, quantity) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256'],
      ['freemint', recipient, quantity]
    ).slice(2),
    'hex'
  )
}

function whitelistMint(recipient, price) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256'],
      ['wlmint', recipient, price]
    ).slice(2),
    'hex'
  )
}

function publicMint(price) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'uint256'],
      ['publicmint', price]
    ).slice(2),
    'hex'
  )
}

describe('PolycatGirl Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners();

    const nft = await deploy('PolycatGirl', 'preview', signers[0].address)
    await bindContract('withNFT', 'PolycatGirl', nft, signers)
    
    const [
      admin,
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4,
      fundee
    ] = signers

    //make admin MINTER_ROLE, FUNDER_ROLE, CURATOR_ROLE
    await admin.withNFT.grantRole(getRole('MINTER_ROLE'), admin.address)
    await admin.withNFT.grantRole(getRole('FUNDER_ROLE'), admin.address)
    await admin.withNFT.grantRole(getRole('CURATOR_ROLE'), admin.address)
    
    this.signers = { 
      admin,
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4,
      fundee
    }
  })
  
  it('Should not WL mint', async function () {
    const { admin, tokenOwner1, tokenOwner2 } = this.signers

    await expect(//WL bad proof (wrong address)
      tokenOwner1.withNFT['mint(address,uint256,uint256,bytes)'](
        tokenOwner2.address, //recipient
        1, //quantity
        10, //price
        await admin.signMessage(
          whitelistMint(tokenOwner1.address, 10)
        ), //proof
        { value: 10 }
      )
    ).to.be.revertedWith('InvalidCall()')

    await expect(//WL price wrong
      tokenOwner1.withNFT['mint(address,uint256,uint256,bytes)'](
        tokenOwner1.address, //recipient
        1, //quantity
        10, //price
        await admin.signMessage(
          whitelistMint(tokenOwner1.address, 10)
        ), //proof
        { value: 0 }
      )
    ).to.be.revertedWith('InvalidCall()')

    await expect(//bad proof (wrong price)
      tokenOwner1.withNFT['mint(address,uint256,uint256,bytes)'](
        tokenOwner2.address, //recipient
        1, //quantity
        10, //price
        await admin.signMessage(
          whitelistMint(tokenOwner1.address, 5)
        ), //proof
        { value: 10 }
      )
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should not public mint', async function () {
    const { admin, tokenOwner1, tokenOwner2 } = this.signers

    await expect(//public price wrong
      tokenOwner1.withNFT['mint(uint256,uint256,bytes)'](
        1, //quantity
        10, //price
        await admin.signMessage(publicMint(10)), //proof
        { value: 0 }
      )
    ).to.be.revertedWith('InvalidCall()')

    await expect(//public price wrong
      tokenOwner1.withNFT['mint(uint256,uint256,bytes)'](
        1, //quantity
        0, //price
        await admin.signMessage(publicMint(10)), //proof
        { value: 10 }
      )
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should free mint', async function () {
    const { admin, tokenOwner1 } = this.signers

    await admin.withNFT['mint(address,uint256,bytes)'](
      tokenOwner1.address, //recipient
      10, //quantity
      await admin.signMessage(freeMint(tokenOwner1.address, 10)) //proof
    )

    expect(await admin.withNFT.balanceOf(tokenOwner1.address)).to.equal(10)
    expect(await admin.withNFT.ownerOf(1)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(2)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(3)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(4)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(5)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(6)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(7)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(8)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(9)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(10)).to.equal(tokenOwner1.address)
  })
  
  it('Should WL mint', async function () {
    const { admin, tokenOwner2 } = this.signers

    await admin.withNFT['mint(address,uint256,uint256,bytes)'](
      tokenOwner2.address, //recipient
      10, //quantity
      1000000, //price
      await admin.signMessage(
        whitelistMint(tokenOwner2.address, 1000000)
      ), //proof
      { value: 10000000 }
    )

    expect(await admin.withNFT.balanceOf(tokenOwner2.address)).to.equal(10)
    expect(await admin.withNFT.ownerOf(11)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(12)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(13)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(14)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(15)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(16)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(17)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(18)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(19)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(20)).to.equal(tokenOwner2.address)
  })

  it('Should public mint', async function () {
    const { admin, tokenOwner3 } = this.signers

    await tokenOwner3.withNFT['mint(uint256,uint256,bytes)'](
      10, //quantity
      1000000, //price
      await admin.signMessage(publicMint(1000000)), //proof
      { value: 10000000 }
    )

    expect(await admin.withNFT.balanceOf(tokenOwner3.address)).to.equal(10)
    expect(await admin.withNFT.ownerOf(21)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(22)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(23)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(24)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(25)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(26)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(27)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(28)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(29)).to.equal(tokenOwner3.address)
    expect(await admin.withNFT.ownerOf(30)).to.equal(tokenOwner3.address)
  })

  it('Should admin mint', async function () {
    const { admin, tokenOwner4 } = this.signers

    await admin.withNFT['mint(address,uint256)'](tokenOwner4.address, 10)
    expect(await admin.withNFT.balanceOf(tokenOwner4.address)).to.equal(10)
    expect(await admin.withNFT.ownerOf(31)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(32)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(33)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(34)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(35)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(36)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(37)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(38)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(39)).to.equal(tokenOwner4.address)
    expect(await admin.withNFT.ownerOf(40)).to.equal(tokenOwner4.address)
  })

  it('Should get the correct token URIs', async function () {
    const { admin } = this.signers

    for (let i = 1; i <= 40; i++) {
      expect(
        await admin.withNFT.tokenURI(i)
      ).to.equal('preview')
    }

    await expect(//token does not exist
      admin.withNFT.tokenURI(41)
    ).to.be.revertedWith('InvalidCall()')

    await admin.withNFT.setBaseTokenURI('foo://bar/')

    for (let i = 1; i <= 40; i++) {
      expect(
        await admin.withNFT.tokenURI(i)
      ).to.equal(`foo://bar/${i}.json`)
    }
  })

  it('Should withdraw', async function () {
    const { admin, fundee } = this.signers

    const startingBalance = await fundee.getBalance()
    await admin.withNFT.withdraw(fundee.address)
    
    expect(parseFloat(
      await fundee.getBalance()
      //also less gas
    ) - startingBalance).to.be.above(20000000)
  })
})