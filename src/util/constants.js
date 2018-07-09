export const NETWORKS = {
  '1': 'Main Net',
  '2': 'Deprecated Morden test network',
  '3': 'Ropsten test network',
  '4': 'Rinkeby test network',
  '42': 'Kovan test network',
  '4447': 'Truffle Develop Network',
  '5777': 'Ganache Blockchain'
}

export const MUTATION_TYPES = {
  CHANGE_CURRENT_ROUTE_TO: 'changeCurrentRouteTo',
  REGISTER_WEB3_INSTANCE: 'registerWeb3Instance',
  UPDATE_USER_BLOCKCHAIN_STATUS: 'updateUserBlockchainStatus',
  UPDATE_WEB3_PROPERTIES: 'updateWeb3Properties',
  UPDATE_USER_BALANCE: 'updateUserBalance',
  SET_CURRENT_VIEW: 'setCurrentView',
  UPDATE_DAPP_READINESS: 'updateDAppReadiness'
}

export const ACTION_TYPES = MUTATION_TYPES
