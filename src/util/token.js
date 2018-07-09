import ContractBase from './contractbase'
import contract from 'truffle-contract'

export default class Token extends ContractBase {
  constructor (web3, contractAddress, contractObject, exchangeAddress) {
    super(web3, contractAddress, contract(contractObject))

    this.exchangeAddress = exchangeAddress
  }

  async balanceOf (accountAddress) {
    let balance = await this.contractInstance.balanceOf(accountAddress)

    return balance.toNumber().toString()
  }

  async allowance (accountAddress, spenderAddress) {
    let allowance = await this.contractInstance.allowance(accountAddress, spenderAddress)

    return allowance.toNumber().toString()
  }

  async gimme (me, requested) {
    const balance = parseInt(await this.balanceOf(me))

    await this.contractInstance.gimme(requested, {from: me, gas: this.gas})
    await this.contractInstance.approve(this.exchangeAddress, requested + balance, {from: me, gas: this.gas})

    return requested + balance
  }
}
