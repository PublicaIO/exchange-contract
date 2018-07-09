import PebblesContractObject from '../../build/contracts/PebblesTokenMock.json'
import Token from './token'

export default class Pebbles extends Token {
  constructor (web3, address, exchangeAddress) {
    super(web3, address, PebblesContractObject, exchangeAddress)
  }
}
