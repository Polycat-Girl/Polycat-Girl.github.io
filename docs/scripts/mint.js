window.addEventListener('web3sdk-ready', async () => {
  //------------------------------------------------------------------//
  // Variables

  const publicData = {
    method: 'mint(uint256,uint256,bytes)',
    args: {
      price: '15000000000000000000',
      //testnet
      proof: '0xdfed1e99851675ca414e6791eb585053b4093bf1'
        + '6bb89321c6f0f1e5fe4eeb3e64e1863438d81a103488e'
        + '2aec571feaae6330086349fe1fcf617904e0a6eb1181c',
      //mainnet
      proof: '0x8ea22f93cf8bcd1fa87a3ad451e8139a0d6394ec'
        + '4f72ebf4a4a788cd37c1f3a34e536b714b54196988382'
        + 'fd624d6f91a01c6c02d85654b6ffe8f06fb0e1f3ad81c'
    }
  }

  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')

  //------------------------------------------------------------------//
  // Functions

  const write = async (contract, method, args, value, success, error) => {
    const params = { to: contract.address, from: Web3SDK.state.account }
    const call = contract.resource.methods[method](...args)
    if (/^[0-9]+$/ig.test(String(value))) {
      params.value = String(Web3SDK.web3().utils.toHex(value))
    }
    try {
      await call.estimateGas(params)
    } catch(e) {
      const pattern = /have (\d+) want (\d+)/
      const matches = e.message.match(pattern)
      if (matches && matches.length === 3) {
        e.message = e.message.replace(pattern, `have ${
          Web3SDK.toEther(matches[1], 'number').toFixed(5)
        } MATIC want ${
          Web3SDK.toEther(matches[2], 'number').toFixed(5)
        } MATIC`)
      }
      return error(e, e.message.replace('err: i', 'I'))
    }

    const confirmations = 2
    const send = new Promise(async (resolve, reject) => {
      //get the method rpc
      const rpc = call.send(params)

      //listen to observers
      rpc.on('transactionHash', hash => {
        notify(
         'success', 
         `Transaction started on <a href="${network.config.chain_scanner}/tx/${hash}" target="_blank">
           ${network.config.chain_scanner}
         </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
         1000000
        )
      })

      rpc.on('confirmation', (confirmationNumber, receipt) => {
        if (confirmationNumber > confirmations) return
        if (confirmationNumber == confirmations) {
         notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
           ${network.config.chain_scanner}
         </a>.`)
         success()
         resolve()
         return
        }
        notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
         ${network.config.chain_scanner}
        </a>. Please stay on this page and wait for ${confirmations} confirmations...`, 1000000)
      });

      rpc.on('receipt', receipt => {
        notify(
         'success', 
         `Confirming on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
           ${network.config.chain_scanner}
         </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
         1000000
        )
      });

      try {
        await rpc
      } catch(e) {
        reject(e)
      }
    })

    try {
      await send
    } catch(e) {
      return error(e, e.message.replace('err: i', 'I'))
    }
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('decrease-amount-click', _ => {
    const amount = document.querySelector('input.amount')
    const subtotal = document.querySelector('a.btn-mint')

    const { authorized, mode } = Web3SDK.state
    if (!authorized || !mode) return

    const value = parseInt(amount.value)
    if (value > 1) {
      amount.value = value - 1
      if (authorized[mode]?.args?.price) {
        const price = Web3SDK.toEther(String(authorized[mode].args.price))
        subtotal.innerHTML = `Mint (${price * (value - 1)} MATIC)`;
      }
    }
  })

  window.addEventListener('increase-amount-click', _ => {
    const amount = document.querySelector('input.amount')
    const subtotal = document.querySelector('a.btn-mint')

    const { authorized, mode } = Web3SDK.state
    if (!authorized || !mode) return

    const value = parseInt(amount.value)
    amount.value = value + 1
    if (authorized[mode]?.args?.price) {
      const price = Web3SDK.toEther(String(authorized[mode].args.price))
      subtotal.innerHTML = `Mint (${price * (value + 1)} MATIC)`;
    }
  })

  window.addEventListener('mint-click', async _ => {
    const mode = publicData
    const amount = document.querySelector('input.amount')
    const method = mode.method
    const args = [ amount.value, mode.args.price, mode.args.proof ]
    const value = Web3SDK.toBigNumber(mode.args.price).mul(
      Web3SDK.toBigNumber(amount.value)
    ).toString()
    
    await write(nft, method, args, value, () => {
      notify('success', 'Mint successful')
    }, (e, message) => {
      notify('error', message)
    })
  })
})