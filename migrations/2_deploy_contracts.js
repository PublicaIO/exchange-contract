var PebblesContract = artifacts.require("PebblesTokenMock");
var ExchangeContract = artifacts.require("Exchange");

module.exports = (deployer) => {
  // tests will deploy contracts any way before every test
  if (deployer.network_id != 0xdeadbeef) {
    deployer.deploy(PebblesContract, 0, 0).then(() => {
      console.log("        *** Deployed PebblesContract.address: " + PebblesContract.address)
      return deployer.deploy(ExchangeContract, PebblesContract.address).then(() => {
        console.log("        *** Deployed Exchange.address: " + ExchangeContract.address)
      })
    });
  }
};
