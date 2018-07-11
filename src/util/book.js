import BookContractObject from '../../build/contracts/BookTokenMock.json'
import Token from './token'

export default class Book extends Token {
  constructor (web3, address, exchangeAddress) {
    super(web3, address, BookContractObject, exchangeAddress)
  }

  async deploy (me) {
    let instance = await this.truffleContract.new({from: me, gas: this.gas})
    this.contractInstance = this.truffleContract.at(instance.address)

    return instance
  }
}
