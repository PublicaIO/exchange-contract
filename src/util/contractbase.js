
export default class ContractBase {
  constructor (web3, contractAddress, truffleContract) {
    truffleContract.setProvider(web3.currentProvider)

    if (contractAddress) {
      this.contractInstance = truffleContract.at(contractAddress)
    }

    this.truffleContract = truffleContract
    this.gas = 6654755
  }

  get address () {
    return this.contractInstance.address
  }
}
