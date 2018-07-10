pragma solidity ^0.4.22;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Exchange is Ownable, Contactable, HasNoEther {
    uint8 constant BUY = 0;
    uint8 constant SELL = 1;

    struct Order {
        address owner;
        uint amountTokens;
        uint pricePbl;
        uint index;
    }

    struct Token {
        string symbol;

        // order id => [BUY | SELL] => Order struct mapping
        mapping (bytes8 => Order)[2] orders;

        // list of order ids
        bytes8[][2] ordersIndex;
    }

    ERC20 public pebbles;

    // token address => Token struct mapping
    mapping (address => Token) public tokens;

    // list of registered tokens (for querying list)
    address[] public tokensIndex;

    // Balances of users
    // trader => token => amount
    mapping (address => mapping (address => uint)) tokenBalance;
    mapping (address => uint) pblBalance;

    // User funds locked in orders
    // trader => token => amount
    mapping (address => mapping (address => uint)) tokenLocked;
    mapping (address => uint) pblLocked;

    event TokenAddedToSystem(string _token);

    event DepositForPBLReceived(address indexed _from, uint _amountPBL);
    event WithdrawalPBL(address indexed _to, uint _amountPBL);

    event DepositForTokenReceived(address indexed _from, address indexed _tokenAddress, uint _amountTokens);
    event WithdrawalToken(address indexed _to, address indexed _tokenAddress, uint _amountTokens);

    event BuyOrderCreated(bytes8 indexed _id, address indexed _tokenAddress, address indexed _who, uint _amountTokens, uint _pricePbl);
    event SellOrderCreated(bytes8 indexed _id, address indexed _tokenAddress, address indexed _who, uint _amountTokens, uint _pricePbl);

    event BuyOrderFulfilled(bytes8 indexed _id, address indexed _tokenAddress, address indexed _who);
    event SellOrderFulfilled(bytes8 indexed _id, address indexed _tokenAddress, address indexed _who);

    event BuyOrderCancelled(bytes8 indexed _id, address indexed _tokenAddress);
    event SellOrderCancelled(bytes8 indexed _id, address indexed _tokenAddress);

    event DEBUGS(string indexed message);

    constructor(ERC20 _pebbles)
      public
      Ownable()
      Contactable()
      HasNoEther()
    {
        pebbles = _pebbles;
    }

    function registerToken(address _tokenAddress, string _symbol) public onlyOwner {
        require(bytes(_symbol).length > 0, "Book token title must be specified");
        require(bytes(tokens[_tokenAddress].symbol).length == 0, "Book token already registered");

        tokens[_tokenAddress].symbol = _symbol;
        tokensIndex.push(_tokenAddress);

        emit TokenAddedToSystem(_symbol);
    }

    function countRegisteredTokens() public view returns (uint) {
        return tokensIndex.length;
    }

    function haveRegisteredToken(address _tokenAddress) public view returns (bool) {
        return bytes(tokens[_tokenAddress].symbol).length > 0;
    }

    function requireRegisteredToken(address _tokenAddress) private view {
        require(haveRegisteredToken(_tokenAddress), "Token not registered");
    }

    function depositToken(address _tokenAddress, uint _amountTokens) public {
        requireRegisteredToken(_tokenAddress);
        require(_amountTokens > 0, "Incorrect amount");

        ERC20 token = ERC20(_tokenAddress);

        require(token.allowance(msg.sender, address(this)) >= _amountTokens, "Amount not approved in source contract");
        require(token.transferFrom(msg.sender, address(this), _amountTokens) == true, "Transfer from source contract failed");

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.add(tokenBalance[msg.sender][_tokenAddress], _amountTokens);

        emit DepositForTokenReceived(msg.sender, _tokenAddress, _amountTokens);
    }

    function withdrawToken(address _tokenAddress, uint _amountTokens) public {
        requireRegisteredToken(_tokenAddress);
        require(_amountTokens > 0, "Incorrect amount");
        require(tokenBalance[msg.sender][_tokenAddress] >= _amountTokens, "Requested amount is above available balance");

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.sub(tokenBalance[msg.sender][_tokenAddress], _amountTokens);

        ERC20 token = ERC20(_tokenAddress);

        require(token.transfer(msg.sender, _amountTokens) == true, "Transfer to source contract failed");

        emit WithdrawalToken(msg.sender, _tokenAddress, _amountTokens);
    }

    function depositPbl(uint _amountPbl) public {
        require(_amountPbl > 0, "Incorrect amount");
        require(pebbles.allowance(msg.sender, address(this)) >= _amountPbl, "Amount not approved in source contract");
        require(pebbles.transferFrom(msg.sender, address(this), _amountPbl) == true, "Transfer from source contract failed");

        pblBalance[msg.sender] = SafeMath.add(pblBalance[msg.sender], _amountPbl);

        emit DepositForPBLReceived(msg.sender, _amountPbl);
    }

    function withdrawPbl(uint _amountPbl) public {
        require(_amountPbl > 0, "Incorrect amount");
        require(pblBalance[msg.sender] >= _amountPbl, "Requested amount is above available balance");

        pblBalance[msg.sender] = SafeMath.sub(pblBalance[msg.sender], _amountPbl);

        require(pebbles.transfer(msg.sender, _amountPbl) == true, "Transfer to source contract failed");

        emit WithdrawalPBL(msg.sender, _amountPbl);
    }

    function tokenBalanceOf(address _tokenAddress, address _owner) public view returns (uint) {
        return tokenBalance[_owner][_tokenAddress];
    }

    function pblBalanceOf(address _owner) public view returns (uint) {
        return pblBalance[_owner];
    }

    function tokenLockedOf(address _tokenAddress, address _owner) public view returns (uint) {
        return tokenLocked[_owner][_tokenAddress];
    }

    function pblLockedOf(address _owner) public view returns (uint) {
        return pblLocked[_owner];
    }

    function haveBuyOrder(address _tokenAddress, bytes8 _id) public view returns (bool) {
        return haveOrder(BUY, _tokenAddress, _id);
    }

    function haveSellOrder(address _tokenAddress, bytes8 _id) public view returns (bool) {
        return haveOrder(SELL, _tokenAddress, _id);
    }

    function haveOrder(uint8 _buyOrSell, address _tokenAddress, bytes8 _id) private view returns (bool) {
        Token storage token = tokens[_tokenAddress];

        bytes8[] storage ordersIndex = token.ordersIndex[_buyOrSell];
        if (ordersIndex.length == 0) {
            return false;
        }

        mapping (bytes8 => Order) orders = token.orders[_buyOrSell];

        return (ordersIndex[orders[_id].index] == _id);
    }

    function requireHaveOrder(uint8 _buyOrSell, address _tokenAddress, bytes8 _id) private view {
        require(haveOrder(_buyOrSell, _tokenAddress, _id), "Order doesn't exist");
    }

    function requireOrderOwner(uint8 _buyOrSell, address _tokenAddress, bytes8 _id) private view {
        require(tokens[_tokenAddress].orders[_buyOrSell][_id].owner == msg.sender, "Not an owner");
    }

    function getBuyOrder(address _tokenAddress, bytes8 _id) public view returns (address, uint, uint) {
        requireHaveOrder(BUY, _tokenAddress, _id);

        return getOrder(BUY, _tokenAddress, _id);
    }

    function getSellOrder(address _tokenAddress, bytes8 _id) public view returns (address, uint, uint) {
        requireHaveOrder(SELL, _tokenAddress, _id);

        return getOrder(SELL, _tokenAddress, _id);
    }

    function getOrder(uint8 _buyOrSell, address _tokenAddress, bytes8 _id) private view returns (address, uint, uint) {
        return (
            tokens[_tokenAddress].orders[_buyOrSell][_id].owner,
            tokens[_tokenAddress].orders[_buyOrSell][_id].amountTokens,
            tokens[_tokenAddress].orders[_buyOrSell][_id].pricePbl
        );
    }

    function getBuyOrders(address _tokenAddress) public view returns (bytes8[]) {
        requireRegisteredToken(_tokenAddress);

        return getOrders(BUY, _tokenAddress);
    }

    function getSellOrders(address _tokenAddress) public view returns (bytes8[]) {
        requireRegisteredToken(_tokenAddress);

        return getOrders(SELL, _tokenAddress);
    }

    function getOrders(uint8 _buyOrSell, address _tokenAddress) private view returns (bytes8[]) {
        return tokens[_tokenAddress].ordersIndex[_buyOrSell];
    }

    function countBuyOrders(address _tokenAddress) public view returns (uint) {
        return countOrders(BUY, _tokenAddress);
    }

    function countSellOrders(address _tokenAddress) public view returns (uint) {
        return countOrders(SELL, _tokenAddress);
    }

    function countOrders(uint8 _buyOrSell, address _tokenAddress) private view returns (uint) {
        return tokens[_tokenAddress].ordersIndex[_buyOrSell].length;
    }

    function placeBuyOrder(address _tokenAddress, uint _amountTokens, uint _pricePbl) public returns (bytes8) {
        requireRegisteredToken(_tokenAddress);
        require(_amountTokens > 0, "Incorrect amount");
        require(_pricePbl > 0, "Incorrect price");

        uint totalPbl = SafeMath.mul(_amountTokens, _pricePbl);
        require(SafeMath.add(totalPbl, pblLockedOf(msg.sender)) <= pblBalanceOf(msg.sender), "Insufficient balance");

        bytes8 id = placeOrder(BUY, _tokenAddress, _amountTokens, _pricePbl);
        pblLocked[msg.sender] = SafeMath.add(pblLocked[msg.sender], totalPbl);

        emit BuyOrderCreated(id, _tokenAddress, msg.sender, _amountTokens, _pricePbl);

        return id;
    }

    function placeSellOrder(address _tokenAddress, uint _amountTokens, uint _pricePbl) public returns (bytes8) {
        requireRegisteredToken(_tokenAddress);
        require(_amountTokens > 0, "Incorrect amount");
        require(_pricePbl > 0, "Incorrect price");
        require(SafeMath.add(_amountTokens, tokenLockedOf(_tokenAddress, msg.sender)) <= tokenBalanceOf(_tokenAddress, msg.sender), "Insufficient balance");

        bytes8 id = placeOrder(SELL, _tokenAddress, _amountTokens, _pricePbl);

        tokenLocked[msg.sender][_tokenAddress] = SafeMath.add(tokenLocked[msg.sender][_tokenAddress], _amountTokens);

        emit SellOrderCreated(id, _tokenAddress, msg.sender, _amountTokens, _pricePbl);

        return id;
    }

    function placeOrder(uint8 _buyOrSell, address _tokenAddress, uint _amountTokens, uint _pricePbl) private returns (bytes8) {
        mapping (bytes8 => Order) orders = tokens[_tokenAddress].orders[_buyOrSell];
        bytes8[] storage ordersIndex = tokens[_tokenAddress].ordersIndex[_buyOrSell];

        bytes8 id = bytes8(keccak256(abi.encodePacked(block.number, msg.sender, _tokenAddress, _buyOrSell, _amountTokens, _pricePbl)));

        // collision?
        require(orders[id].pricePbl == 0, "Hash collision");

        orders[id].owner = msg.sender;
        orders[id].amountTokens = _amountTokens;
        orders[id].pricePbl = _pricePbl;
        orders[id].index = ordersIndex.push(id) - 1;

        return id;
    }

    function cancelBuyOrder(address _tokenAddress, bytes8 _id) public {
        requireRegisteredToken(_tokenAddress);
        requireHaveOrder(BUY, _tokenAddress, _id);
        requireOrderOwner(BUY, _tokenAddress, _id);

        cancelOrder(BUY, _tokenAddress, _id);

        Order storage order = tokens[_tokenAddress].orders[BUY][_id];
        uint totalPbl = SafeMath.mul(order.amountTokens, order.pricePbl);
        pblLocked[msg.sender] = SafeMath.sub(pblLocked[msg.sender], totalPbl);

        emit BuyOrderCancelled(_id, _tokenAddress);
    }

    function cancelSellOrder(address _tokenAddress, bytes8 _id) public {
        requireRegisteredToken(_tokenAddress);
        requireHaveOrder(SELL, _tokenAddress, _id);
        requireOrderOwner(SELL, _tokenAddress, _id);

        cancelOrder(SELL, _tokenAddress, _id);

        uint amountTokens = tokens[_tokenAddress].orders[SELL][_id].amountTokens;
        tokenLocked[msg.sender][_tokenAddress] = SafeMath.sub(tokenLocked[msg.sender][_tokenAddress], amountTokens);

        emit SellOrderCancelled(_id, _tokenAddress);
    }

    function cancelOrder(uint8 _buyOrSell, address _tokenAddress, bytes8 _id) private {
        Token storage token = tokens[_tokenAddress];

        mapping (bytes8 => Order) orders = token.orders[_buyOrSell];
        bytes8[] storage ordersIndex = token.ordersIndex[_buyOrSell];

        uint rowToDelete = orders[_id].index;
        bytes8 keyToMove = ordersIndex[ordersIndex.length - 1];
        ordersIndex[rowToDelete] = keyToMove;
        orders[keyToMove].index = rowToDelete;
        ordersIndex.length--;
    }

    // sell tokens for PBLs
    function fulfillBuyOrder(address _tokenAddress, bytes8 _id, uint _amountTokens) public {
        requireRegisteredToken(_tokenAddress);
        requireHaveOrder(BUY, _tokenAddress, _id);
        require(_amountTokens > 0, "Incorrect amount");
        require(tokenBalance[msg.sender][_tokenAddress] >= _amountTokens, "Requested amount is above available balance");

        Token storage token = tokens[_tokenAddress];

        mapping (bytes8 => Order) orders = token.orders[BUY];
        bytes8[] storage ordersIndex = token.ordersIndex[BUY];

        Order storage order = orders[_id];
        require(_amountTokens <= order.amountTokens, "Requested amount is above supply");

        uint maxTokens = _amountTokens < order.amountTokens ? _amountTokens : order.amountTokens;
        uint totalPbl = SafeMath.mul(maxTokens, order.pricePbl);

        tokenBalance[order.owner][_tokenAddress] = SafeMath.add(tokenBalance[order.owner][_tokenAddress], maxTokens);
        pblBalance[msg.sender] = SafeMath.add(pblBalance[msg.sender], totalPbl);
        pblLocked[order.owner] = SafeMath.sub(pblLocked[order.owner], totalPbl);

        if (maxTokens == order.amountTokens) {
            uint rowToDelete = orders[_id].index;
            bytes8 keyToMove = ordersIndex[ordersIndex.length - 1];
            ordersIndex[rowToDelete] = keyToMove;
            orders[keyToMove].index = rowToDelete;
            ordersIndex.length--;
        } else {
            order.amountTokens = SafeMath.sub(order.amountTokens, maxTokens);
        }

        emit BuyOrderFulfilled(_id, _tokenAddress, msg.sender);
    }

    // buy tokens for PBLs
    function fulfillSellOrder(address _tokenAddress, bytes8 _id, uint _amountTokens) public {
        requireRegisteredToken(_tokenAddress);
        requireHaveOrder(SELL, _tokenAddress, _id);
        require(_amountTokens > 0, "Incorrect amount");

        Token storage token = tokens[_tokenAddress];

        mapping (bytes8 => Order) orders = token.orders[SELL];
        bytes8[] storage ordersIndex = token.ordersIndex[SELL];

        Order storage order = orders[_id];

        uint maxTokens = _amountTokens < order.amountTokens ? _amountTokens : order.amountTokens;
        uint totalPbl = SafeMath.mul(maxTokens, order.pricePbl);

        require(pblBalance[msg.sender] >= totalPbl, "Requested amount is above available balance");
        require(_amountTokens <= order.amountTokens, "Requested amount is above supply");

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.add(tokenBalance[msg.sender][_tokenAddress], maxTokens);
        pblBalance[order.owner] = SafeMath.add(pblBalance[order.owner], totalPbl);
        tokenLocked[order.owner][_tokenAddress] = SafeMath.sub(tokenLocked[order.owner][_tokenAddress], _amountTokens);

        if (maxTokens == order.amountTokens) {
            uint rowToDelete = orders[_id].index;
            bytes8 keyToMove = ordersIndex[ordersIndex.length - 1];
            ordersIndex[rowToDelete] = keyToMove;
            orders[keyToMove].index = rowToDelete;
            ordersIndex.length--;
        } else {
            order.amountTokens = SafeMath.sub(order.amountTokens, maxTokens);
        }

        emit SellOrderFulfilled(_id, _tokenAddress, msg.sender);
    }
}
