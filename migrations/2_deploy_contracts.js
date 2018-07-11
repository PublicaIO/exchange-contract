var PebblesContract = artifacts.require("PebblesTokenMock");
var ExchangeContract = artifacts.require("Exchange");

module.exports = (deployer, network, accounts) => {
  // tests will deploy contracts any way before every test
  // if (network != 0xdeadbeef) {
    console.log(network)
    console.log(accounts)
    deployer.deploy(PebblesContract).then(() => {
      console.log("        *** Deployed PebblesContract.address: " + PebblesContract.address)
      return deployer.deploy(ExchangeContract, PebblesContract.address).then(() => {
        console.log("        *** Deployed Exchange.address: " + ExchangeContract.address)
      })
    });
  // }
};
