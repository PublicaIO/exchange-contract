var Ganache = require("ganache-core");

var logger = {
  log: function(a) {console.log(a);}
};

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    test: {
      network_id: 0xdeadbeef,
      provider: Ganache.provider()
    }
  }
};
