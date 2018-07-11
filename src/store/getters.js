import Exchange from '../util/exchange'
import Pebbles from '../util/pebbles'

export default {
  exchange (state) {
    return new Exchange(state.web3.instance(), state.user.exchangeContractAddress, state.user.coinbase)
  },
  pebbles (state, getters) {
    return new Pebbles(state.web3.instance(), state.user.pblContractAddress, getters.exchange.address)
  },
  eth (state) {
    let web3 = state.web3.instance()
    let coinbase = state.user.coinbase

    return new Promise(function (resolve, reject) {
      web3.eth.getBalance(coinbase, (err, res) => {
        if (!err) {
          resolve(web3.fromWei(res.toNumber()))
        } else {
          console.error(err)
        }
      })
    })
  }
}
