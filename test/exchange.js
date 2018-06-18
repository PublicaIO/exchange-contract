
var truffleAssert = require('truffle-assertions');
var expectThrow = require('./helper.js');

var Exchange = artifacts.require("Exchange");
var PBLToken = artifacts.require("StandardTokenMock");
var BookToken = artifacts.require("StandardTokenMock");

contract("Exchange", (accounts) => {
  let owner = accounts[0];
  let adversary = accounts[1];
  let pblHolder = accounts[2];
  let bookHolder = accounts[3];
  let exchange;
  let pblToken;
  let bookToken;

  beforeEach(async () => {
    pblToken = await PBLToken.new(pblHolder, 100);
    bookToken = await BookToken.new(bookHolder, 1);
    exchange = await Exchange.new(pblToken.address);
  });

  describe('registerToken()', () => {
    it('registerToken() raises exception on double added token', async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await expectThrow(exchange.registerToken(bookToken.address, "Book2"));
    });

    it('registerToken() on success emits TokenAddedToSystem', async () => {
      truffleAssert.eventEmitted(await exchange.registerToken(bookToken.address, "Book1"), 'TokenAddedToSystem');
    });

    it('registerToken() registers token', async () => {
      await exchange.registerToken(bookToken.address, "Book1");

      let symbol = await exchange.tokens.call(bookToken.address);
      let address = await exchange.tokensIndex.call(0);

      assert.equal(address, bookToken.address);
      assert.equal(symbol, ["Book1"]);
    });
  });

  describe('depositToken()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
    });

    it('should raise exception on unknown tokens', async () => {
      await expectThrow(exchange.depositToken(0xff, 1, {from: bookHolder}));
    });

    it('should raise exception on invalid amount of tokens', async () => {
      await expectThrow(exchange.depositToken(bookToken.address, 0, {from: bookHolder}));
    });

    it('should raise exception if deposit more then approved', async () => {
      await expectThrow(exchange.depositToken(bookToken.address, 2, {from: bookHolder}));
    });

    it('should allow to deposit a book token', async () => {
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});

      var transferred = (await bookToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.tokenBalanceOf.call(bookToken.address, bookHolder)).toNumber();
      assert.equal(deposited, 1);
    });
  });

  describe('withdrawToken()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});
    });

    it('should raise exception on unknown tokens', async () => {
      await expectThrow(exchange.withdrawToken(0xff, 1, {from: bookHolder}));
    });

    it('should raise exception on invalid amount of tokens', async () => {
      await expectThrow(exchange.withdrawToken(bookToken.address, 0, {from: bookHolder}));
    });

    it('should raise exception if withdraw amount more then balance', async () => {
      await expectThrow(exchange.withdrawToken(bookToken.address, 2, {from: bookHolder}));
    });

    it('should allow to withdraw a book token', async () => {
      await exchange.withdrawToken(bookToken.address, 1, {from: bookHolder});

      var transferred = (await bookToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 0);

      var deposited = (await exchange.tokenBalanceOf.call(bookToken.address, bookHolder)).toNumber();
      assert.equal(deposited, 0);
    });
  });

  describe('depositPbl()', () => {
    beforeEach(async () => {
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
    });

    it('should raise exception on invalid amount of Pbls', async () => {
      await expectThrow(exchange.depositPbl(0, {from: pblHolder}));
    });

    it('should raise exception if deposit more then approved', async () => {
      await expectThrow(exchange.depositPbl(2, {from: pblHolder}));
    });

    it('should allow to deposit Pbl', async () => {
      await exchange.depositPbl(1, {from: pblHolder});

      var transferred = (await pblToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 1);
    });
  });

  describe('withdrawPbl()', () => {
    beforeEach(async () => {
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});
    });

    it('should raise exception on invalid amount of Pbls', async () => {
      await expectThrow(exchange.withdrawPbl(0, {from: pblHolder}));
    });

    it('should raise exception if withdraw amount more then balance', async () => {
      await expectThrow(exchange.withdrawPbl(2, {from: pblHolder}));
    });

    it('should allow to withdraw Pbl', async () => {
      await exchange.withdrawPbl(1, {from: pblHolder});

      var transferred = (await pblToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 0);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 0);
    });
  });

  // it('getMarket() should return empty market', async function() {
  //   let result = await exchange.registerToken(bookToken.address, "Book1");

  //   let [symbol, buyTotalTokens, sellTotalTokens, buyTotalPBL, sellTotalPBL] = await exchange.getMarket(bookToken.address);

  //   assert.equal(symbol, 'Book1');
  //   assert.equal(buyTotalTokens.toNumber(), 0);
  //   assert.equal(sellTotalTokens.toNumber(), 0);
  //   assert.equal(buyTotalPBL.toNumber(), 0);
  //   assert.equal(sellTotalPBL.toNumber(), 0);
  // });

  // it('getMarket() on unknown token must raise exception', async function() {
  //   let result = await exchange.registerToken(bookToken.address, "Book1");
  //   await expectThrow(exchange.getMarket(0x02));
  // });

  describe('placeBuyOrder() / placeSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
    });

    it('placeBuyOrder() on unknown token raises exception', async () => {
      await expectThrow(exchange.placeBuyOrder(0xff, 1, 1));
    });

    it('placeSellOrder() on unknown token raises exception', async () => {
      await expectThrow(exchange.placeSellOrder(0xff, 1, 1));
    });

    it('placeBuyOrder() with incorrect number of tokens raises exception', async () => {
      await expectThrow(exchange.placeBuyOrder(bookToken.address, 0, 1));
    });

    it('placeSellOrder() with incorrect number of tokens raises exception', async () => {
      await expectThrow(exchange.placeSellOrder(bookToken.address, 0, 1));
    });

    it('placeBuyOrder() with incorrect price raises exception', async () => {
      await expectThrow(exchange.placeBuyOrder(bookToken.address, 1, 0));
    });

    it('placeSellOrder() with incorrect price raises exception', async () => {
      await expectThrow(exchange.placeSellOrder(bookToken.address, 1, 0));
    });

    it('placeBuyOrder() on success emits BuyOrderCreated', async () => {
      truffleAssert.eventEmitted(await exchange.placeBuyOrder(bookToken.address, 1, 1), 'BuyOrderCreated');
    });

    it('placeBuyOrder() on success emits SellOrderCreated', async () => {
      truffleAssert.eventEmitted(await exchange.placeSellOrder(bookToken.address, 1, 1), 'SellOrderCreated');
    });
  });

  describe('getBuyOrder() / getSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
    });

    it('getBuyOrder() returns correct order', async () => {
      await exchange.placeBuyOrder(bookToken.address, 5, 5);

      let orders = await exchange.getBuyOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getBuyOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 5);
      assert.equal(order[1].toNumber(), 5);
    });

    it('getSellOrder() returns correct order', async () => {
      await exchange.placeSellOrder(bookToken.address, 5, 5);

      let orders = await exchange.getSellOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getSellOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 5);
      assert.equal(order[1].toNumber(), 5);
    });
  });

  describe('getBuyOrders() / getSellOrders()', () => {
    beforeEach(async function() {
      await exchange.registerToken(bookToken.address, "Book1");
    });

    it('getBuyOrders() on unknown token raises exception', async () => {
      await expectThrow(exchange.getBuyOrders(0xff));
    });

    it('getSellOrders() on unknown token raises exception', async () => {
      await expectThrow(exchange.getSellOrders(0xff));
    });

    it('getBuyOrders() on empty orders returns empty list', async () => {
      let orders = await exchange.getBuyOrders.call(bookToken.address);

      assert.equal(orders.length, 0);
    });

    it('getSellOrders() on empty orders returns empty list', async () => {
      let orders = await exchange.getSellOrders.call(bookToken.address);

      assert.equal(orders.length, 0);
    });

    it('getBuyOrders() on added order returns order', async () => {
      await exchange.placeBuyOrder(bookToken.address, 5, 5);

      let orders = await exchange.getBuyOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getBuyOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 5);
      assert.equal(order[1].toNumber(), 5);
    });

    it('getSellOrders() on added order returns order', async () => {
      await exchange.placeSellOrder(bookToken.address, 5, 5);

      let orders = await exchange.getSellOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getSellOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 5);
      assert.equal(order[1].toNumber(), 5);
    });
  });

  describe('cancelBuyOrder() / cancelSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
    });

    it('cancelBuyOrder() on unknown token raises exception', async () => {
      await expectThrow(exchange.cancelBuyOrder(0xff, "123"));
    });

    it('cancelSellOrder() on unknown token raises exception', async () => {
      await expectThrow(exchange.cancelSellOrder(0xff, "123"));
    });

    it('cancelBuyOrder() on unknown order ID raises exception', async () => {
      await expectThrow(exchange.cancelBuyOrder(bookToken.address, "123"));
    });

    it('cancelSellOrder() on unknown order ID raises exception', async () => {
      await expectThrow(exchange.cancelSellOrder(bookToken.address, "123"));
    });

    it('cancelBuyOrder() from another sender raises exception', async () => {
      let id = await exchange.placeBuyOrder(bookToken.address, 1, 1);

      await expectThrow(exchange.cancelBuyOrder.call(bookToken.address, id, {from: adversary}));
    });

    it('cancelSellOrder() from another sender raises exception', async () => {
      let id = await exchange.placeSellOrder(bookToken.address, 1, 1);

      await expectThrow(exchange.cancelSellOrder.call(bookToken.address, id, {from: adversary}));
    });

    it('cancelBuyOrder() on success emits BuyOrderCancelled', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1);

      let id = (await exchange.getBuyOrders(bookToken.address))[0];

      truffleAssert.eventEmitted(await exchange.cancelBuyOrder(bookToken.address, id), 'BuyOrderCanceled');
    });

    it('cancelSellOrder() on success emits SellOrderCanceled', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1);

      let id = (await exchange.getSellOrders(bookToken.address))[0];

      truffleAssert.eventEmitted(await exchange.cancelSellOrder(bookToken.address, id), 'SellOrderCanceled');
    });

    it('cancelBuyOrder() on added order removes order', async () => {
      await exchange.placeBuyOrder(bookToken.address, 5, 5);

      let id = (await exchange.getBuyOrders(bookToken.address))[0];

      await exchange.cancelBuyOrder(bookToken.address, id);

      let orders = await exchange.getBuyOrders(bookToken.address);

      assert.equal(orders.length, 0);
    });

    it('cancelSellOrder() on added order removes order', async () => {
      await exchange.placeSellOrder(bookToken.address, 5, 5);

      let id = (await exchange.getSellOrders(bookToken.address))[0];

      await exchange.cancelSellOrder(bookToken.address, id);

      let orders = await exchange.getSellOrders(bookToken.address);

      assert.equal(orders.length, 0);
    });
  });

  describe('fulfillBuyOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
    });

    it('fulfillBuyOrder() on unknown token raises exception', async () => {
      await expectThrow(exchange.fulfillBuyOrder(0xff, "123", 1));
    });

    it('fulfillBuyOrder() on unknown order raises exception', async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, "123", 1));
    });

    it('fulfillBuyOrder() with wrong amount of tokens raises exception', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 10);

      let id = (await exchange.getBuyOrders(bookToken.address))[0];

      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, id, 0));
    });

    it('fulfillBuyOrder() raises exception on insufficient token balance', async () => {
      await exchange.depositPBL.call(bookToken.address, 1, 10, {from: other_account});
      await exchange.placeBuyOrder.call(bookToken.address, 1, 10, {from: other_account});

      let id = (await exchange.getBuyOrders(bookToken.address))[0];

      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, id, 10));
    });
  });
});
