import Exchange from '../../../../build/contracts/Exchange.json'
import { queryBalance } from '../balancebutton/BalanceButtonActions'
import store from '../../../store'

const contract = require('truffle-contract')

export function queryOrders(buyOrSell) {
  let web3 = store.getState().web3.web3Instance

  // Double-check web3's status.
  if (typeof web3 !== 'undefined') {

    return function(dispatch) {
      const exchange = contract(Exchange)
      exchange.setProvider(web3.currentProvider)
      
      // Get current ethereum wallet.
      web3.eth.getCoinbase((error, coinbase) => {
        // Log errors, if any.
        if (error) {
          console.error(error);
        }
      
        exchange.deployed().then(function(instance) {
      
          // Attempt to login user.
          authenticationInstance.update(name, {from: coinbase})
          .then(function(result) {
            // If no error, update user.
      
            dispatch(userUpdated({"name": name}))
      
            return alert('Name updated!')
          })
          .catch(function(result) {
            // If error...
          })
        })
      })
    }
  } else {
    console.error('Web3 is not initialized.');
  }
}

export function cancelOrder(buyOrSell, order) {
  let web3 = store.getState().web3.web3Instance

  // Double-check web3's status.
  if (typeof web3 !== 'undefined') {

    return function(dispatch) {
      const exchange = contract(Exchange)
      exchange.setProvider(web3.currentProvider)

      // Get current ethereum wallet.
      web3.eth.getCoinbase((error, coinbase) => {
        // Log errors, if any.
        if (error) {
          console.error(error);
        }

        exchange.deployed().then(function(instance) {      
          if (buyOrSell == 'buy') {
            instance.cancelBuyOrder(order.id, {from: coinbase})
            .then(function(result) {
              dispatch(queryBalance('buy'))
            })
            .catch(function(result) {
              // If error...
              console.log(result)
            })          
          } else {
            instance.cancelSellOrder(order.id, {from: coinbase})
            .then(function(result) {
              dispatch(queryBalance('sell'))
            })
            .catch(function(result) {
              // If error...
              console.log(result)
            })            
          }
        });
      })
    }
  } else {
    console.error('Web3 is not initialized.');
  }
}
