export default {
  currentRoute: null,
  currentView: null,
  web3: {
    address: null,
    coinbase: null,
    error: null,
    instance: null,
    isInjected: false,
    networkId: null
  },
  user: {
    balance: '0.00',
    coinbase: '',
    hasCoinbase: false,
    hasWeb3InjectedBrowser: false,
    pebblesContractAddress: null,
    exchangeContractAddress: null
  },
  isDAppReady: false
}
