import { MUTATION_TYPES } from '../util/constants'
import contract from 'truffle-contract'
import PebblesContractObject from '../../build/contracts/PebblesTokenMock.json'
import ExchangeContractObject from '../../build/contracts/Exchange.json'

export default {
  [MUTATION_TYPES.REGISTER_WEB3_INSTANCE] (state, payload) {
    const result = payload.result

    const web3Copy = state.web3
    web3Copy.instance = () => result.web3
    web3Copy.address = result.address ? result.address.toString() : web3Copy.address
    web3Copy.coinbase = result.coinbase ? result.coinbase.toString() : web3Copy.coinbase
    web3Copy.networkId = result.networkId ? result.networkId.toString() : web3Copy.networkId
    web3Copy.error = result.web3Error ? result.web3Error : web3Copy.error
    web3Copy.isInjected = result.hasInjectedWeb3 ? result.hasInjectedWeb3 : web3Copy.isInjected

    state.web3 = web3Copy

    if (payload.callback) payload.callback(state)
  },
  [MUTATION_TYPES.UPDATE_USER_BLOCKCHAIN_STATUS] (state, payload) {
    const hasWeb3InjectedBrowser = state.web3.isInjected
    const hasCoinbase = !!(state.web3.coinbase && state.web3.coinbase !== '')
    const coinbase = state.web3.coinbase
    const web3Status = {
      hasWeb3InjectedBrowser,
      hasCoinbase,
      coinbase
    }

    let warningMessage = null
    if (hasWeb3InjectedBrowser) {
      if (!hasCoinbase) {
        warningMessage = "Looks like you haven't logged into your Web3 injector. If you're using Metamask and you'd signed up, please log into Metamask, else click on the 'Sign Up' link above to begin."
      }
    } else {
      warningMessage = 'Your browser is not Web3-enabled.'
    }

    if (hasWeb3InjectedBrowser && hasCoinbase) {
      const web3 = state.web3.instance()
      const pebblesContract = contract(PebblesContractObject)
      pebblesContract.setProvider(web3.currentProvider)

      const exchangeContract = contract(ExchangeContractObject)
      exchangeContract.setProvider(web3.currentProvider)

      pebblesContract.deployed()
        .then((contractInstance) => {
          console.log('PBL contract deployed: ' + contractInstance.address)
          const userCopy = state.user
          userCopy.pebblesContractAddress = contractInstance.address

          exchangeContract.deployed(userCopy.pebblesContractAddress)
            .then((contractInstance) => {
              console.log('ExchangeContract contract deployed: ' + contractInstance.address)

              userCopy.exchangeContractAddress = contractInstance.address

              Object.assign(userCopy, web3Status)
              state.user = userCopy
            })
            .catch((error) => {
              console.log(error)
            })
        })
        .catch((error) => {
          console.log(error)
        })
    } else {
      // resetUser(state, web3Status)
    }

    if (payload.callback) payload.callback({status: !warningMessage, warningMessage})
  },
  [MUTATION_TYPES.UPDATE_WEB3_PROPERTIES] (state, payload) {
    for (var i = payload.properties.length - 1; i >= 0; i--) {
      state.web3[payload.properties[i]] = payload.values[i]
      if (state.user[payload.properties[i]]) state.user[payload.properties[i]] = payload.values[i]
    }
  },
  [MUTATION_TYPES.SET_CURRENT_VIEW] (state, newRoute) {
    state.currentView = newRoute.meta.view
  },
  [MUTATION_TYPES.UPDATE_DAPP_READINESS] (state, isReady) {
    state.isDAppReady = isReady
  },
  [MUTATION_TYPES.CHANGE_CURRENT_ROUTE_TO] (state, newRoute) {
    state.currentRoute = newRoute
  }
  // [MUTATION_TYPES.UPDATE_USER_BALANCE] (state, payload) {
  //   const userCopy = state.user
  //   userCopy.balance = payload.balance
  //   userCopy.balancePBL = payload.balancePBL
  //   state.user = userCopy
  // }
}
