import contract from 'truffle-contract'
import ExchangeContractObject from '../../build/contracts/Exchange.json'
import ContractBase from './contractbase'

export default class Exchange extends ContractBase {
  constructor (web3, address, me) {
    const exchangeContract = contract(ExchangeContractObject)
    super(web3, address, exchangeContract)
    this.me = me
  }

  async registerToken (tokenAddress, title, commissionPermille, commissionReceiver) {
    console.log(this.me)
    return await this.contractInstance.registerToken(tokenAddress, title, commissionPermille, commissionReceiver, {from: this.me, gas: this.gas})
  }

  async getRegisteredBooks () {
    const countTokens = await this.contractInstance.countRegisteredTokens.call()
    const booksCount = countTokens.toNumber()

    let addresses = await Promise.all([...Array(booksCount).keys()].map(i => this.contractInstance.tokensIndex.call(i)))
    let data = await Promise.all(addresses.map(a => this.contractInstance.getRegisteredToken.call(a)))

    return addresses.map((a, i) => {
      return {address: a, data: data[i]}
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

    return await orders.map(order => {
      return {
        id: order.id,
        owner: order.data[0],
        price: order.data[1].toNumber(),
        amount: order.data[2].toNumber()
      }
    })
  }

  async placeOrder (direction, tokenAddress, amount, price) {
    let method = 'place' + direction + 'Order'

    return this.contractInstance[method](tokenAddress, amount, price, {from: this.me, gas: this.gas})
  }

  async acceptOrder (direction, tokenAddress, id) {
    let getOrderMethod = 'get' + direction + 'Order'
    let acceptOrderMethod = 'fulfill' + direction + 'Order'

    return this.contractInstance[getOrderMethod](tokenAddress, id, {from: this.me, gas: this.gas})
      .then((data) => {
        const amount = data[1]
        return this.contractInstance[acceptOrderMethod](tokenAddress, id, amount, {from: this.me, gas: this.gas})
      })
  }

  async cancelOrder (direction, tokenAddress, id) {
    let cancelOrderMethod = 'cancel' + direction + 'Order'

    return this.contractInstance[cancelOrderMethod](tokenAddress, id, {from: this.me, gas: this.gas})
  }

  async depositPbl (amount) {
    return this.contractInstance.depositPbl(amount, {from: this.me, gas: this.gas})
  }

  async depositToken (tokenAddress, amount) {
    return this.contractInstance.depositToken(tokenAddress, amount, {from: this.me, gas: this.gas})
  }
}
