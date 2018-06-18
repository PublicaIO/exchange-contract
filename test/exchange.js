
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
    it('should raise exception on double added token', async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await expectThrow(exchange.registerToken(bookToken.address, "Book2"));
    });

    it('should emit TokenAddedToSystem on success', async () => {
      truffleAssert.eventEmitted(await exchange.registerToken(bookToken.address, "Book1"), 'TokenAddedToSystem');
    });

    it('should register book token', async () => {
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

    it('should raise exception if unknown book token specified', async () => {
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

    it('should raise exception if unknown book token specified', async () => {
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

    it('should raise exception on invalid amount of PBL', async () => {
      await expectThrow(exchange.depositPbl(0, {from: pblHolder}));
    });

    it('should raise exception if deposit more then approved', async () => {
      await expectThrow(exchange.depositPbl(2, {from: pblHolder}));
    });

    it('should allow to deposit PBL', async () => {
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

    it('should raise exception on invalid amount of PBL', async () => {
      await expectThrow(exchange.withdrawPbl(0, {from: pblHolder}));
    });

    it('should raise exception if withdraw amount more then balance', async () => {
      await expectThrow(exchange.withdrawPbl(2, {from: pblHolder}));
    });

    it('should allow to withdraw PBL', async () => {
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

  describe('placeBuyOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.placeBuyOrder(0xff, 1, 1, {from: pblHolder}));
    });

    it('should raise exception if incorrect number of tokens specified', async () => {
      await expectThrow(exchange.placeBuyOrder(bookToken.address, 0, 1, {from: pblHolder}));
    });

    it('should raise exception on incorrect price specified', async () => {
      await expectThrow(exchange.placeBuyOrder(bookToken.address, 1, 0, {from: pblHolder}));
    });

    it('should raise exception if PBL balance is insufficient', async () => {
      await expectThrow(exchange.placeBuyOrder(bookToken.address, 1, 2, {from: pblHolder}));
    });

    it('should create PBL encumberance', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});
      let encumberance = await exchange.pblEncumberanceOf(pblHolder);

      assert.equal(encumberance.toNumber(), 1);
    });

    it('should raise exception on existing PBL encumberance and insufficient PBL balance to create new order', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});

      await expectThrow(exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder}));
    });

    it('should emit BuyOrderCreated on success', async () => {
      truffleAssert.eventEmitted(await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder}), 'BuyOrderCreated');
    });

    it('should create buy order on success', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});
      let orders = await exchange.getBuyOrders(bookToken.address);
      assert.equal(orders.length, 1);
    });
  });

  describe('placeSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.placeSellOrder(0xff, 1, 1, {from: bookHolder}));
    });

    it('should raise exception if incorrect number of tokens specified', async () => {
      await expectThrow(exchange.placeSellOrder(bookToken.address, 0, 1, {from: bookHolder}));
    });

    it('should raise exception on incorrect price specified', async () => {
      await expectThrow(exchange.placeSellOrder(bookToken.address, 1, 0, {from: bookHolder}));
    });

    it('should raise exception if book token balance is insufficient', async () => {
      await expectThrow(exchange.placeSellOrder(bookToken.address, 2, 100, {from: bookHolder}));
    });

    it('should create book token encumberance', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});
      let encumberance = await exchange.tokenEncumberanceOf(bookToken.address, bookHolder);

      assert.equal(encumberance.toNumber(), 1);
    });

    it('should raise exception on existing book token encumberance and insufficient token balance to create new order', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 100, {from: bookHolder});

      await expectThrow(exchange.placeSellOrder(bookToken.address, 1, 1000, {from: bookHolder}));
    });

    it('should emit SellOrderCreated on success', async () => {
      truffleAssert.eventEmitted(await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder}), 'SellOrderCreated');
    });

    it('should create sell order on success', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});
      let orders = await exchange.getSellOrders(bookToken.address);

      assert.equal(orders.length, 1);
    });
  });

  describe('getBuyOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});
    });

    it('should return correct order on success', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});

      let orders = await exchange.getBuyOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getBuyOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 1);
      assert.equal(order[1].toNumber(), 1);
    });
  });

  describe('getSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});
    });

    it('should return correct order on success', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});

      let orders = await exchange.getSellOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getSellOrder(bookToken.address, id);

      assert.equal(order[0].toNumber(), 1);
      assert.equal(order[1].toNumber(), 1);
    });
  });

  describe('getBuyOrders()', () => {
    beforeEach(async function() {
      await exchange.registerToken(bookToken.address, "Book1");
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.getBuyOrders(0xff));
    });

    it('should return empty list if no orders', async () => {
      let orders = await exchange.getBuyOrders.call(bookToken.address);

      assert.equal(orders.length, 0);
    });

    it('should return orders on success', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});

      let orders = await exchange.getBuyOrders(bookToken.address);

      assert.equal(orders.length, 1);
    });
  });

  describe('getSellOrders()', () => {
    beforeEach(async function() {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.getSellOrders(0xff));
    });

    it('should return empty list if no orders', async () => {
      let orders = await exchange.getSellOrders.call(bookToken.address);

      assert.equal(orders.length, 0);
    });

    it('should return orders on success', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});

      let orders = await exchange.getSellOrders(bookToken.address);

      assert.equal(orders.length, 1);
    });
  });

  describe('cancelBuyOrder()', () => {
    let orderId;

    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await pblToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});

      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});
      orderId = (await exchange.getBuyOrders(bookToken.address))[0];
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.cancelBuyOrder(0xff, "123", {from: pblHolder}));
    });

    it('should raise exception if order id not found', async () => {
      await expectThrow(exchange.cancelBuyOrder(bookToken.address, "123", {from: pblHolder}));
    });

    it('should raise exception on attempt to cancel order not from owner', async () => {
      await expectThrow(exchange.cancelBuyOrder(bookToken.address, orderId, {from: adversary}));
    });

    it('should emit BuyOrderCancelled on success', async () => {
      truffleAssert.eventEmitted(await exchange.cancelBuyOrder(bookToken.address, orderId, {from: pblHolder}), 'BuyOrderCanceled');
    });

    it('should remove order on success', async () => {
      await exchange.cancelBuyOrder(bookToken.address, orderId, {from: pblHolder});
      let orders = await exchange.getBuyOrders(bookToken.address);

      assert.equal(orders.length, 0);
    });
  });

  describe('cancelSellOrder()', () => {
    let orderId;

    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1");
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});

      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});
      orderId = (await exchange.getSellOrders(bookToken.address))[0];
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.cancelSellOrder(0xff, "123", {from: bookHolder}));
    });

    it('should raise exception if order id not found', async () => {
      await expectThrow(exchange.cancelSellOrder(bookToken.address, "123", {from: bookHolder}));
    });

    it('should raise exception on attempt to cancel order not from owner', async () => {
      await expectThrow(exchange.cancelSellOrder.call(bookToken.address, id, {from: adversary}));
    });

    it('should emit SellOrderCanceled on success', async () => {
      truffleAssert.eventEmitted(await exchange.cancelSellOrder(bookToken.address, orderId, {from: bookHolder}), 'SellOrderCanceled');
    });

    it('should remove order on success', async () => {
      await exchange.cancelSellOrder(bookToken.address, orderId, {from: bookHolder});
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
