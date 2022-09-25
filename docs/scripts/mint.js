window.addEventListener('web3sdk-ready', async () => {
  //------------------------------------------------------------------//
  // Variables

  const publicData = {
    method: 'mint(uint256,uint256,bytes)',
    args: {
      price: '15000000000000000000',
      proof: '0xdfed1e99851675ca414e6791eb585053b4093bf1'
        + '6bb89321c6f0f1e5fe4eeb3e64e1863438d81a103488e'
        + '2aec571feaae6330086349fe1fcf617904e0a6eb1181c'
    }
  }

  const stages = [
    //{
    //  start: 1664104537000, //Sep 25 00:00:00
    //  end: 1664380800000, //Sep 25 23:59:59
    //  modes: [ 'genesis', 'stacked', 'whitelist', 'public' ]
    //},
    {
      start: 1664380800000, //Sep 29 00:00:00
      end: 1664467199000, //Sep 29 23:59:59
      modes: [ 'genesis', 'stacked' ]
    },
    {
      start: 1664467200000, //Sep 30 00:00:00
      end: 1664553599000, //Sep 30 23:59:59
      modes: [ 'whitelist' ]
    },
    {
      start: 1664553600000, //Oct 1 00:00:00
      end: 1664639999000, //Oct 1 23:59:59
      modes: [ 'public' ]
    }
  ]

  const template = {
    tab: document.getElementById('template-tab').innerHTML,
    genesis: document.getElementById('template-mint-genesis').innerHTML,
    stacked: document.getElementById('template-mint-stacked').innerHTML,
    whitelist: document.getElementById('template-mint-whitelist').innerHTML,
    public: document.getElementById('template-mint-public').innerHTML
  }

  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')

  const tabs = document.querySelector('div.tabs')
  const content = document.querySelector('div.content')

  //------------------------------------------------------------------//
  // Functions

  const stage = _ => {
    const now = Date.now()
    for (const stage of stages) {
      if (stage.start <= now && now <= stage.end) {
        return stage.modes
      }
    }

    return []
  }

  const setAuthorized = async _ => {
    Web3SDK.state.authorized = {}
    try {
      //get authorized chunk
      const key = Web3SDK.state.account.substring(10, 12).toLowerCase()
      const response = await fetch(`/data/authorized/${key}.json`)
      //set authorized state
      const json = await response.json()
      Web3SDK.state.authorized = json[Web3SDK.state.account.toLowerCase()] || {}
    } catch(e) {}
    const modes = stage()
    //if public is a mode
    if (modes.indexOf('public') !== -1) {
      Web3SDK.state.authorized.public = publicData
    }

    return Web3SDK.state.authorized
  }

  const setTabs = async _ => {
    const account = Web3SDK.state.account
    const modes = stage()
    const authorized = await setAuthorized()
    //if nothing is authorized or no available modes
    if (!Object.keys(authorized).length || !modes.length) {
      theme.hide('.connected', true)
      theme.hide('.disconnected', false)
      return notify('error', `${account} is not allowed to mint`)
    }
    
    //reset tabs
    tabs.innerHTML = ''
    //for each mode in authorized account
    for (const mode of Object.keys(authorized)) {
      //if mode isn't in modes
      if (modes.indexOf(mode) === -1) continue
      const tab = theme.toElement(template.tab, {
        '{MODE}': mode,
        '{LABEL}': mode.charAt(0).toUpperCase() + mode.slice(1)
      })
      tabs.append(tab)
      window.doon(tab)
    }
  }

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

  window.addEventListener('web3sdk-connected', async _ => {
    await setTabs()
  })

  window.addEventListener('web3sdk-disconnected', async _ => {
    delete Web3SDK.state.mode
    delete Web3SDK.state.authorized
  })

  window.addEventListener('tab-click', e => {
    //set active mode
    Web3SDK.state.mode = e.for.getAttribute('data-mode')

    theme.hide(e.for.parentNode, true)
    
    const form = theme.toElement(template[Web3SDK.state.mode])
    content.appendChild(form)
    window.doon(form)

    if (Web3SDK.state.mode === 'genesis'
      && Web3SDK.state.authorized[Web3SDK.state.mode]?.args?.quantity
    ) {
      document.querySelector('a.btn-mint').innerHTML = `Mint ${
        Web3SDK.state.authorized[Web3SDK.state.mode].args.quantity
      }`
    }
  })

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
    const mode = Web3SDK.state.authorized[Web3SDK.state.mode]
    const amount = document.querySelector('input.amount')
    const args = []
    let value = 0
    switch (mode.method) {
      //recipient, quantity, proof (free)
      case 'mint(address,uint256,bytes)':
        args.push.apply(args, [
          Web3SDK.state.account, 
          mode.args.quantity,
          mode.args.proof
        ])
        break
      //quantity, price, proof (public)
      case 'mint(uint256,uint256,bytes)':
        args.push.apply(args, [
          amount.value,
          mode.args.price,
          mode.args.proof
        ])
        value = Web3SDK.toBigNumber(mode.args.price).mul(
          Web3SDK.toBigNumber(amount.value)
        ).toString()
        break
      //recipient, quantity, price, proof (whitelist)
      case 'mint(address,uint256,uint256,bytes)':
        args.push.apply(args, [
          Web3SDK.state.account, 
          amount.value,
          mode.args.price,
          mode.args.proof
        ])
        value = Web3SDK.toBigNumber(mode.args.price).mul(
          Web3SDK.toBigNumber(amount.value)
        ).toString()
        break
    }
    
    await write(nft, mode.method, args, value, () => {
      notify('success', 'Mint successful')
    }, (e, message) => {
      notify('error', message)
    })
  })
})