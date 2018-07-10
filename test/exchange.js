
var truffleAssert = require('truffle-assertions')
var expectThrow = require('./helper.js')

var ExchangeContract = artifacts.require("Exchange")
var PebblesTokenContract = artifacts.require("PebblesTokenMock")
var BookTokenContract = artifacts.require("BookTokenMock")

contract("Exchange", (accounts) => {
  let owner = accounts[0]
  let adversary = accounts[1]
  let pblHolder = accounts[2]
  let bookHolder = accounts[3]
  let systemCommissionReceiver = accounts[4]
  let bookCommissionReceiver = accounts[5]
  let exchange
  let pebblesToken
  let bookToken
  const ONE_PBL = 10 ** 18

  beforeEach(async () => {
    pebblesToken = await PebblesTokenContract.new()
    bookToken = await BookTokenContract.new()
    exchange = await ExchangeContract.new(pebblesToken.address)

    await pebblesToken.gimme(10 * ONE_PBL, {from: pblHolder})
    await bookToken.gimme(100, {from: bookHolder})
  });

  describe('registerToken()', () => {
    it('should raise exception on double added token', async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await expectThrow(exchange.registerToken(bookToken.address, "Book2"));
    });

    it('should emit TokenAddedToSystem on success', async () => {
      truffleAssert.eventEmitted(
        await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver),
        'TokenAddedToSystem'
      );
    });

    it('should register book token', async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);

      let token = await exchange.getRegisteredToken(bookToken.address);

      assert.equal(token[0], "Book1");
      assert.equal(token[1], 0);
      assert.equal(token[2], bookCommissionReceiver);
    });
  });

  describe('depositToken()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
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
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await bookToken.approve(exchange.address, 2, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 2, {from: bookHolder});
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.withdrawToken(0xff, 1, {from: bookHolder}));
    });

    it('should raise exception on invalid amount of tokens', async () => {
      await expectThrow(exchange.withdrawToken(bookToken.address, 0, {from: bookHolder}));
    });

    it('should raise exception if withdraw amount more then balance', async () => {
      await expectThrow(exchange.withdrawToken(bookToken.address, 3, {from: bookHolder}));
    });

    it('should allow to withdraw a book token', async () => {
      await exchange.withdrawToken(bookToken.address, 2, {from: bookHolder});

      var transferred = (await bookToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 0);

      var deposited = (await exchange.tokenBalanceOf.call(bookToken.address, bookHolder)).toNumber();
      assert.equal(deposited, 0);
    });

    it('should allow to partially withdraw token', async () => {
      await exchange.withdrawToken(bookToken.address, 1, {from: bookHolder});

      var transferred = (await bookToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.tokenBalanceOf.call(bookToken.address, bookHolder)).toNumber();
      assert.equal(deposited, 1);
    });

    it('should allow partial withdrawal if funds are locked', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder})
      await exchange.withdrawToken(bookToken.address, 1, {from: bookHolder});

      var transferred = (await bookToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.tokenBalanceOf.call(bookToken.address, bookHolder)).toNumber();
      assert.equal(deposited, 1);
    });

    it('should disallow withdrawal of locked tokens', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder})
      await expectThrow(exchange.withdrawToken(bookToken.address, 2, {from: bookHolder}));
    });
  });

  describe('depositPbl()', () => {
    beforeEach(async () => {
      await pebblesToken.approve(exchange.address, 1, {from: pblHolder});
    });

    it('should raise exception on invalid amount of PBL', async () => {
      await expectThrow(exchange.depositPbl(0, {from: pblHolder}));
    });

    it('should raise exception if deposit more then approved', async () => {
      await expectThrow(exchange.depositPbl(2, {from: pblHolder}));
    });

    it('should allow to deposit PBL', async () => {
      await exchange.depositPbl(1, {from: pblHolder});

      var transferred = (await pebblesToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 1);
    });
  });

  describe('withdrawPbl()', () => {
    beforeEach(async () => {
      await pebblesToken.approve(exchange.address, 2, {from: pblHolder});
      await exchange.depositPbl(2, {from: pblHolder});
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver, {from: owner});
    });

    it('should raise exception on invalid amount of PBL', async () => {
      await expectThrow(exchange.withdrawPbl(0, {from: pblHolder}));
    });

    it('should raise exception if withdraw amount more then balance', async () => {
      await expectThrow(exchange.withdrawPbl(3, {from: pblHolder}));
    });

    it('should allow to withdraw PBL', async () => {
      await exchange.withdrawPbl(2, {from: pblHolder});

      var transferred = (await pebblesToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 0);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 0);
    });

    it('should allow to partially withdraw PBL', async () => {
      await exchange.withdrawPbl(1, {from: pblHolder});

      var transferred = (await pebblesToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 1);
    });

    it('should allow partial withdrawal if funds are locked', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder})
      await exchange.withdrawPbl(1, {from: pblHolder});

      var transferred = (await pebblesToken.balanceOf.call(exchange.address)).toNumber();
      assert.equal(transferred, 1);

      var deposited = (await exchange.pblBalanceOf.call(pblHolder)).toNumber();
      assert.equal(deposited, 1);
    });

    it('should disallow withdrawal of locked PBL', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder})
      await expectThrow(exchange.withdrawPbl(2, {from: pblHolder}));
    });
  });

  describe('placeBuyOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await pebblesToken.approve(exchange.address, 1, {from: pblHolder});
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

    it('should create PBL lock', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});
      let lock = await exchange.pblLockedOf(pblHolder);

      assert.equal(lock.toNumber(), 1);
    });

    it('should raise exception on existing PBL lock and insufficient PBL balance to create new order', async () => {
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
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
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

    it('should create book token lock', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});
      let lock = await exchange.tokenLockedOf(bookToken.address, bookHolder);

      assert.equal(lock.toNumber(), 1);
    });

    it('should raise exception on existing book token lock and insufficient token balance to create new order', async () => {
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
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await pebblesToken.approve(exchange.address, 1, {from: pblHolder});
      await exchange.depositPbl(1, {from: pblHolder});
    });

    it('should return correct order on success', async () => {
      await exchange.placeBuyOrder(bookToken.address, 1, 1, {from: pblHolder});

      let orders = await exchange.getBuyOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getBuyOrder(bookToken.address, id);

      assert.equal(order[0], pblHolder);
      assert.equal(order[1].toNumber(), 1);
      assert.equal(order[2].toNumber(), 1);
    });
  });

  describe('getSellOrder()', () => {
    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await bookToken.approve(exchange.address, 1, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 1, {from: bookHolder});
    });

    it('should return correct order on success', async () => {
      await exchange.placeSellOrder(bookToken.address, 1, 1, {from: bookHolder});

      let orders = await exchange.getSellOrders(bookToken.address);
      id = orders[0];

      order = await exchange.getSellOrder(bookToken.address, id);

      assert.equal(order[0], bookHolder);
      assert.equal(order[1].toNumber(), 1);
      assert.equal(order[2].toNumber(), 1);
    });
  });

  describe('getBuyOrders()', () => {
    beforeEach(async function() {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await pebblesToken.approve(exchange.address, 1, {from: pblHolder});
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
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
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
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
      await pebblesToken.approve(exchange.address, 1, {from: pblHolder});
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
      truffleAssert.eventEmitted(await exchange.cancelBuyOrder(bookToken.address, orderId, {from: pblHolder}), 'BuyOrderCancelled');
    });

    it('should remove order on success', async () => {
      await exchange.cancelBuyOrder(bookToken.address, orderId, {from: pblHolder});
      let orders = await exchange.getBuyOrders(bookToken.address);

      assert.equal(orders.length, 0);
      await expectThrow(exchange.getBuyOrder(bookToken.address, orderId));
    });

    it('should clear lock on success', async () => {
      let before = await exchange.pblLockedOf(pblHolder);
      await exchange.cancelBuyOrder(bookToken.address, orderId, {from: pblHolder});
      let after = await exchange.pblLockedOf(pblHolder);

      assert.equal(before.toNumber(), 1);
      assert.equal(after.toNumber(), 0);
    });
  });

  describe('cancelSellOrder()', () => {
    let orderId;

    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);
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

    it('should emit SellOrderCancelled on success', async () => {
      truffleAssert.eventEmitted(await exchange.cancelSellOrder(bookToken.address, orderId, {from: bookHolder}), 'SellOrderCancelled');
    });

    it('should remove order on success', async () => {
      await exchange.cancelSellOrder(bookToken.address, orderId, {from: bookHolder});
      let orders = await exchange.getSellOrders(bookToken.address);

      assert.equal(orders.length, 0);
      await expectThrow(exchange.getSellOrder(bookToken.address, orderId));
    });

    it('should clear lock on success', async () => {
      let before = await exchange.tokenLockedOf(bookToken.address, bookHolder);
      await exchange.cancelSellOrder(bookToken.address, orderId, {from: bookHolder});
      let after = await exchange.tokenLockedOf(bookToken.address, bookHolder);

      assert.equal(before.toNumber(), 1);
      assert.equal(after.toNumber(), 0);
    });
  });

  describe('fulfillBuyOrder()', () => {
    let orderId;

    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);

      await pebblesToken.approve(exchange.address, 2 * ONE_PBL, {from: pblHolder});
      await exchange.depositPbl(2 * ONE_PBL, {from: pblHolder});

      await bookToken.approve(exchange.address, 2, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 2, {from: bookHolder});

      await exchange.placeBuyOrder(bookToken.address, 2, ONE_PBL, {from: pblHolder});
      orderId = (await exchange.getBuyOrders(bookToken.address))[0];
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.fulfillBuyOrder(0xff, "123", 1, {from: bookHolder}));
    });

    it('should raise exception if order id not found', async () => {
      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, "123", 1, {from: bookHolder}));
    });

    it('should raise exception if incorrect number of tokens specified', async () => {
      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, orderId, 0, {from: bookHolder}));
    });

    it('should raise exception if requested number of tokens is above order', async () => {
      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, orderId, 3, {from: bookHolder}));
    });

    it('should raise exception on insufficient token balance', async () => {
      await expectThrow(exchange.fulfillBuyOrder(bookToken.address, orderId, 10, {from: bookHolder}));
    });

    it('should fulfill full order', async () => {
      await exchange.fulfillBuyOrder(bookToken.address, orderId, 2, {from: bookHolder});

      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let pblHolderTokens = await exchange.tokenBalanceOf(bookToken.address, pblHolder);

      assert.equal(await exchange.haveBuyOrder(bookToken.address, orderId), false);
      assert.equal(bookHolderPbls.toNumber(), 2 * ONE_PBL);
      assert.equal(pblHolderTokens.toNumber(), 2);
    });

    it('should fulfill partial order', async () => {
      await exchange.fulfillBuyOrder(bookToken.address, orderId, 1, {from: bookHolder});
      let order = await exchange.getBuyOrder(bookToken.address, orderId);
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let pblHolderTokens = await exchange.tokenBalanceOf(bookToken.address, pblHolder);

      assert.equal(order[1].toNumber(), 1);
      assert.equal(bookHolderPbls.toNumber(), 1 * ONE_PBL);
      assert.equal(pblHolderTokens.toNumber(), 1);
    });

    it('should unlock funds after order fulfilled', async () => {
      let before = await exchange.pblLockedOf(pblHolder);
      await exchange.fulfillBuyOrder(bookToken.address, orderId, 2, {from: bookHolder});
      let after = await exchange.pblLockedOf(pblHolder);

      assert.equal(before.toNumber(), 2 * ONE_PBL);
      assert.equal(after.toNumber(), 0);
    });

    it('should respect system commission settings', async () => {
      await exchange.setSystemCommission(10, systemCommissionReceiver, {from: owner})

      await exchange.fulfillBuyOrder(bookToken.address, orderId, 1, {from: bookHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let systemCommissionReceiverPbls = await exchange.pblBalanceOf(systemCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.99);
      assert.equal(systemCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });

    it('should respect book commission settings', async () => {
      await exchange.updateRegisteredToken(bookToken.address, "Book1", 10, bookCommissionReceiver, {from: owner})

      await exchange.fulfillBuyOrder(bookToken.address, orderId, 1, {from: bookHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let bookCommissionReceiverPbls = await exchange.pblBalanceOf(bookCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.99);
      assert.equal(bookCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });

    it('should respect both book and system commission settings', async () => {
      await exchange.setSystemCommission(10, systemCommissionReceiver, {from: owner})
      await exchange.updateRegisteredToken(bookToken.address, "Book1", 10, bookCommissionReceiver, {from: owner})

      await exchange.fulfillBuyOrder(bookToken.address, orderId, 1, {from: bookHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let bookCommissionReceiverPbls = await exchange.pblBalanceOf(bookCommissionReceiver);
      let systemCommissionReceiverPbls = await exchange.pblBalanceOf(systemCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.98);
      assert.equal(systemCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
      assert.equal(bookCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });
  });

  describe('fulfillSellOrder()', () => {
    let orderId;

    beforeEach(async () => {
      await exchange.registerToken(bookToken.address, "Book1", 0, bookCommissionReceiver);

      await pebblesToken.approve(exchange.address, 2 * ONE_PBL, {from: pblHolder});
      await exchange.depositPbl(2 * ONE_PBL, {from: pblHolder});

      await bookToken.approve(exchange.address, 2, {from: bookHolder});
      await exchange.depositToken(bookToken.address, 2, {from: bookHolder});

      await exchange.placeSellOrder(bookToken.address, 2, ONE_PBL, {from: bookHolder});
      orderId = (await exchange.getSellOrders(bookToken.address))[0];
    });

    it('should raise exception if unknown book token specified', async () => {
      await expectThrow(exchange.fulfillSellOrder(0xff, "123", 1, {from: pblHolder}));
    });

    it('should raise exception if order id not found', async () => {
      await expectThrow(exchange.fulfillSellOrder(bookToken.address, "123", 1, {from: pblHolder}));
    });

    it('should raise exception if incorrect number of tokens specified', async () => {
      await expectThrow(exchange.fulfillSellOrder(bookToken.address, orderId, 0, {from: pblHolder}));
    });

    it('should raise exception if requested number of tokens is above order', async () => {
      await expectThrow(exchange.fulfillSellOrder(bookToken.address, orderId, 3, {from: pblHolder}));
    });

    it('should raise exception on insufficient token balance', async () => {
      await expectThrow(exchange.fulfillSellOrder(bookToken.address, orderId, 10, {from: pblHolder}));
    });

    it('should fulfill full order', async () => {
      await exchange.fulfillSellOrder(bookToken.address, orderId, 2, {from: pblHolder});

      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let pblHolderTokens = await exchange.tokenBalanceOf(bookToken.address, pblHolder);

      assert.equal(await exchange.haveSellOrder(bookToken.address, orderId), false);
      assert.equal(bookHolderPbls.toNumber(), 2 * ONE_PBL);
      assert.equal(pblHolderTokens.toNumber(), 2);
    });

    it('should fulfill partial order', async () => {
      await exchange.fulfillSellOrder(bookToken.address, orderId, 1, {from: pblHolder});
      let order = await exchange.getSellOrder(bookToken.address, orderId);
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let pblHolderTokens = await exchange.tokenBalanceOf(bookToken.address, pblHolder);

      assert.equal(order[1].toNumber(), 1);
      assert.equal(bookHolderPbls.toNumber(), ONE_PBL);
      assert.equal(pblHolderTokens.toNumber(), 1);
    });

    it('should unlock funds after order fulfilled', async () => {
      let before = await exchange.tokenLockedOf(bookToken.address, bookHolder);
      await exchange.fulfillSellOrder(bookToken.address, orderId, 2, {from: pblHolder});
      let after = await exchange.tokenLockedOf(bookToken.address, bookHolder);

      assert.equal(before.toNumber(), 2);
      assert.equal(after.toNumber(), 0);
    });

    it('should respect system commission settings', async () => {
      await exchange.setSystemCommission(10, systemCommissionReceiver, {from: owner})

      await exchange.fulfillSellOrder(bookToken.address, orderId, 1, {from: pblHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let systemCommissionReceiverPbls = await exchange.pblBalanceOf(systemCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.99);
      assert.equal(systemCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });

    it('should respect book commission settings', async () => {
      await exchange.updateRegisteredToken(bookToken.address, "Book1", 10, bookCommissionReceiver, {from: owner})

      await exchange.fulfillSellOrder(bookToken.address, orderId, 1, {from: pblHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let bookCommissionReceiverPbls = await exchange.pblBalanceOf(bookCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.99);
      assert.equal(bookCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });

    it('should respect both book and system commission settings', async () => {
      await exchange.setSystemCommission(10, systemCommissionReceiver, {from: owner})
      await exchange.updateRegisteredToken(bookToken.address, "Book1", 10, bookCommissionReceiver, {from: owner})

      await exchange.fulfillSellOrder(bookToken.address, orderId, 1, {from: pblHolder});
      let bookHolderPbls = await exchange.pblBalanceOf(bookHolder);
      let bookCommissionReceiverPbls = await exchange.pblBalanceOf(bookCommissionReceiver);
      let systemCommissionReceiverPbls = await exchange.pblBalanceOf(systemCommissionReceiver);

      assert.equal(bookHolderPbls.toNumber(), ONE_PBL * 0.98);
      assert.equal(systemCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
      assert.equal(bookCommissionReceiverPbls.toNumber(), ONE_PBL * 0.01);
    });
  });
});
