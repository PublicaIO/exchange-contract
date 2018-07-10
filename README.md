## Sell Book tokens for PBL and vice versa in distributed manner

### Installation
 * `npm install -g truffle`
 * `npm install`

### Test

 * If you're running gangache: `truffle test`
 * Suitable for CI (starts/stops gangache on the background): `truffle test --network=test`
 * Coverage: `./node_modules/.bin/solidity-coverage`

### Demo
 * Install Metamask, choose "Localhost 8545" (or configure by choosing "Custom RPC", set Ganache's default: http://127.0.0.1:8545)
 * In Metamask click "Reveal Seed Words", copy the $phrase
 * Run `ganache-cli -m "$phrase"
 * rm -rf build/contracts
 * truffle migrate

### Troubleshooting
 * If you get this error `Error: the tx doesn't have the correct nonce. account has nonce of: 6 tx has nonce of: 50`, reconnect to "Localhost 8545" in Metamask
