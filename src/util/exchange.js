import contract from 'truffle-contract'
import ExchangeContractObject from '../../build/contracts/Exchange.json'
import ContractBase from './contractbase'

export default class Exchange extends ContractBase {
  constructor (web3, address) {
    const exchangeContract = contract(ExchangeContractObject)
    super(web3, address, exchangeContract)
  }

  async registerToken (tokenAddress, title, ownerAddress) {
    return await this.contractInstance.registerToken(tokenAddress, title, {from: ownerAddress, gas: this.gas})
  }

  async getRegisteredBooks () {
    const countTokens = await this.contractInstance.countRegisteredTokens.call()
    const booksCount = countTokens.toNumber()

    let addresses = await Promise.all([...Array(booksCount).keys()].map(i => this.contractInstance.tokensIndex.call(i)))
    let titles = await Promise.all(addresses.map(a => this.contractInstance.tokens.call(a)))

    return addresses.map((a, i) => {
      return {address: a, title: titles[i]}
    })
  }

  async callMethod (methodName, ...args) {
    return await this.contractInstance[methodName].call(...args)
  }

  async callNumericMethod (methodName, ...args) {
    return await this.callMethod(methodName, ...args)
      .then(result => {
        return result.toNumber().toString()
      })
  }

  async getOrders (direction, tokenAddress) {
    let getOrdersMethod = 'get' + direction + 'Orders'
    let getOrderMethod = 'get' + direction + 'Order'

    let ids = await this.contractInstance[getOrdersMethod].call(tokenAddress)
    let orders = await Promise.all(ids.map(async (id) => {
      return {id: id, data: await this.contractInstance[getOrderMethod].call(tokenAddress, id)}
    }))

    return orders.map(order => {
      return {
        id: order.id,
        owner: order.data[0],
        price: order.data[1].toNumber(),
        amount: order.data[2].toNumber()
      }
    })
  }

  async cancelOrder (direction, tokenAddress, id, ownerAddress) {
    let cancelOrderMethod = 'cancel' + direction + 'Order'

    return this.contractInstance[cancelOrderMethod](tokenAddress, id, {from: ownerAddress, gas: this.gas})
  }

  async realPlaceOrder (direction, tokenAddress, amount, price, ownerAddress) {
    let method = 'place' + direction + 'Order'

    return this.contractInstance[method](tokenAddress, amount, price, {from: ownerAddress, gas: this.gas})
  }

  async placeOrder (direction, tokenAddress, amount, price, ownerAddress) {
    if (direction === 'Buy') {
      this.contractInstance.depositPbl(amount * price, {from: ownerAddress, gas: this.gas}).then(() => {
        this.realPlaceOrder(direction, tokenAddress, amount, price, ownerAddress)
      })
    } else {
      this.contractInstance.depositToken(tokenAddress, amount, {from: ownerAddress, gas: this.gas}).then(() => {
        this.realPlaceOrder(direction, tokenAddress, amount, price, ownerAddress)
      })
    }
  }
}
