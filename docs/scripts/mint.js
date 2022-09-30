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

  const stages = [
    //testnet
    //{
    //  start: 1664104537000, //Sep 25 00:00:00
    //  end: 1664380800000, //Sep 25 23:59:59
    //  modes: [ 'genesis', 'stacked', 'whitelist', 'public' ]
    //},
    {
      start: 1664456400000, //Sep 29 21:00:00
      end: 1664542799000, //Sep 30 20:59:59
      modes: [ 'genesis', 'stacked' ]
    },
    {
      start: 1664542800000, //Sep 30 21:00:00
      end: 1664629199000, //Oct 1 20:59:59
      modes: [ 'whitelist' ]
    },
    {
      start: 1664629200000, //Oct 1 21:00:00
      end: 1664715599000, //Oct 2 20:59:59
      modes: [ 'public' ]
    }
  ]

  const template = {
    tab: document.getElementById('template-tab').innerHTML,
    countdown: document.getElementById('template-countdown').innerHTML,
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

  const getStage = mode => {
    const now = Date.now()
    for (const stage of stages) {
      if (!mode && stage.start <= now && now <= stage.end) {
        return stage
      } else if (mode && stage.modes.indexOf(mode) !== -1) {
        return stage
      }
    }

    return { start: 0, end: 0, modes: [] }
  }

  const setAuthorized = async _ => {
    Web3SDK.state.authorized = { public: publicData }
    try {
      //get authorized chunk
      const key = Web3SDK.state.account.substring(10, 12).toLowerCase()
      const response = await fetch(`/data/authorized/${key}.json`)
      //set authorized state
      const json = await response.json()
      Web3SDK.state.authorized = Object.assign({}, 
        json[Web3SDK.state.account.toLowerCase()] || {}, 
        Web3SDK.state.authorized
      )
    } catch(e) {}
    const stage = getStage()

    return Web3SDK.state.authorized
  }

  const setTabs = async _ => {
    const authorized = await setAuthorized()
    
    //reset tabs
    tabs.innerHTML = ''
    //for each mode in authorized account
    for (const mode of ['genesis', 'stacked', 'whitelist', 'public']) {
      const tab = theme.toElement(template.tab, {
        '{MODE}': mode,
        '{COLOR}': authorized[mode]? 'primary': 'muted',
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

    //get mode, authorized and account
    const { mode, authorized, account } = Web3SDK.state
    //get the active authorization
    const authorization = authorized[mode]
    //hide the tabs
    theme.hide(e.for.parentNode, true)
    //get the info for this stage
    const stage = getStage(mode)
    //error if no stage info found (unlikely)
    if (!stage.modes.length) return notify('error', 'No valid stage found')

    const now = Date.now()
    if (stage.start > now) {
      const countdown = theme.toElement(template.countdown, {
        '{DATE}': stage.start
      })
      content.appendChild(countdown)
      window.doon(countdown)

      //show error if not authorized
      if (!authorization) {
        notify('error', `${account} not allowed to mint on this stage`)
      }

      return
    }

    //if we are here, it's mint time

    //if they are not authoized to mint
    if (!authorization) {
      content.innerHTML = `<div class="alert alert-solid alert-error">${
        account.substring(0, 4)}...${account.substring(account.length - 4)
      } not allowed to mint on this stage</div>`
      return
    }

    
    const form = theme.toElement(template[mode])
    content.appendChild(form)
    window.doon(form)

    if (mode === 'genesis'
      && authorization?.args?.quantity
    ) {
      document.querySelector('a.btn-mint').innerHTML = `Mint ${
        authorization.args.quantity
      }`
    }
  })

  window.addEventListener('countdown-init', e => {
    const date = e.for.getAttribute('data-date').replace(/-/g, '/')
    const days = e.for.querySelector('span.days')
    const hours = e.for.querySelector('span.hours')
    const minutes = e.for.querySelector('span.minutes')
    const seconds = e.for.querySelector('span.seconds')
    setInterval(function () {
      let diff = date - Date.now()
      if (diff < 0) diff = 0

      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const diffMinutes = Math.floor((diff / (1000 * 60)) % 60)
      const diffSeconds = Math.floor((diff / 1000) % 60)

      days.innerText = diffDays < 10 ? '0' + diffDays : diffDays
      hours.innerText = diffHours < 10 ? '0' + diffHours : diffHours
      minutes.innerText = diffMinutes < 10 ? '0' + diffMinutes : diffMinutes
      seconds.innerText = diffSeconds < 10 ? '0' + diffSeconds : diffSeconds
    }, 1000)
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

    //check if they minted already
    if (mode.method === 'mint(address,uint256,bytes)') {
      if (await nft.read().balanceOf(Web3.state.account)) {
        return notify('error', 'You have already minted')
      }
    }

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