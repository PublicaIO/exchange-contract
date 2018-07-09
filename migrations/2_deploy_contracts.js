var PBLToken = artifacts.require("PebblesTokenMock");
var Exchange = artifacts.require("Exchange");
// var BookToken = artifacts.require("BookTokenMock");

module.exports = (deployer) => {
  deployer.deploy(PBLToken, 0, 0).then(() => {
    console.log("        *** Deployed PBLToken.address: " + PBLToken.address)
    return deployer.deploy(Exchange, PBLToken.address).then(() => {
      console.log("        *** Deployed Exchange.address: " + Exchange.address)
    })
  });

  //deployer.deploy(BookToken, 0, 0);
};
