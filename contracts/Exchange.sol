pragma solidity ^0.4.22;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Exchange is Ownable, HasNoEther {
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
        mapping (bytes16 => Order)[2] orders;

        // list of order ids
        bytes16[][2] ordersIndex;
    }

    ERC20 public pebbles;

    // token address => Token struct mapping
    mapping (address => Token) public tokens;

    // list of registered tokens (for querying list)
    address[] public tokensIndex;

    // trader => token => amount
    mapping (address => mapping (address => uint)) tokenBalance;
    mapping (address => uint) pblBalance;

    // trader => token => amount
    mapping (address => mapping (address => uint)) tokenEncumberance;
    mapping (address => uint) pblEncumberance;

    event TokenAddedToSystem(string _token);

    event DepositForPBLReceived(address indexed _from, uint _amountPBL);
    event WithdrawalPBL(address indexed _to, uint _amountPBL);

    event DepositForTokenReceived(address indexed _from, address indexed _tokenAddress, uint _amountTokens);
    event WithdrawalToken(address indexed _to, address indexed _tokenAddress, uint _amountTokens);

    event BuyOrderCreated(bytes16 indexed _id, address indexed _tokenAddress, address indexed _who, uint _amountTokens, uint _pricePbl);
    event SellOrderCreated(bytes16 indexed _id, address indexed _tokenAddress, address indexed _who, uint _amountTokens, uint _pricePbl);

    event BuyOrderFulfilled(bytes16 indexed _id, address indexed _tokenAddress, address indexed _who);
    event SellOrderFulfilled(bytes16 indexed _id, address indexed _tokenAddress, address indexed _who);

    event BuyOrderCanceled(bytes16 indexed _id, address indexed _tokenAddress);
    event SellOrderCanceled(bytes16 indexed _id, address indexed _tokenAddress);

    event DEBUGS(string indexed message);

    constructor(ERC20 _pebbles) public {
        pebbles = _pebbles;
    }

    function registerToken(address _tokenAddress, string _symbol) public onlyOwner {
        require(bytes(_symbol).length > 0, "Book token title must be specified");
        require(bytes(tokens[_tokenAddress].symbol).length == 0, "Book token already registered");

        tokens[_tokenAddress].symbol = _symbol;
        tokensIndex.push(_tokenAddress);

        emit TokenAddedToSystem(_symbol);
    }

    function depositToken(address _tokenAddress, uint _amountTokens) public {
        require(_amountTokens > 0);
        require(bytes(tokens[_tokenAddress].symbol).length > 0);

        ERC20 token = ERC20(_tokenAddress);

        require(token.allowance(msg.sender, address(this)) >= _amountTokens);
        require(token.transferFrom(msg.sender, address(this), _amountTokens) == true);

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.add(tokenBalance[msg.sender][_tokenAddress], _amountTokens);

        emit DepositForTokenReceived(msg.sender, _tokenAddress, _amountTokens);
    }

    function withdrawToken(address _tokenAddress, uint _amountTokens) public {
        require(_amountTokens > 0);
        require(bytes(tokens[_tokenAddress].symbol).length > 0);
        require(tokenBalance[msg.sender][_tokenAddress] >= _amountTokens);

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.sub(tokenBalance[msg.sender][_tokenAddress], _amountTokens);

        ERC20 token = ERC20(_tokenAddress);

        require(token.transfer(msg.sender, _amountTokens) == true);

        emit WithdrawalToken(msg.sender, _tokenAddress, _amountTokens);
    }

    function depositPbl(uint _amountPbl) public {
        require(_amountPbl > 0);
        require(pebbles.allowance(msg.sender, address(this)) >= _amountPbl);
        require(pebbles.transferFrom(msg.sender, address(this), _amountPbl) == true);

        pblBalance[msg.sender] = SafeMath.add(pblBalance[msg.sender], _amountPbl);

        emit DepositForPBLReceived(msg.sender, _amountPbl);
    }

    function withdrawPbl(uint _amountPbl) public {
        require(_amountPbl > 0);
        require(pblBalance[msg.sender] >= _amountPbl);

        pblBalance[msg.sender] = SafeMath.sub(pblBalance[msg.sender], _amountPbl);

        require(pebbles.transfer(msg.sender, _amountPbl) == true);

        emit WithdrawalPBL(msg.sender, _amountPbl);
    }

    function tokenBalanceOf(address tokenAddress, address _owner) public view returns (uint) {
        return tokenBalance[_owner][tokenAddress];
    }

    function pblBalanceOf(address _owner) public view returns (uint) {
        return pblBalance[_owner];
    }

    function tokenEncumberanceOf(address tokenAddress, address _owner) public view returns (uint) {
        return tokenEncumberance[_owner][tokenAddress];
    }

    function pblEncumberanceOf(address _owner) public view returns (uint) {
        return pblEncumberance[_owner];
    }


    // function getMarket(address tokenAddress) public view returns (
    //     string symbol,
    //     uint buyTotalTokens,
    //     uint sellTotalTokens,
    //     uint buyTotalPBL,
    //     uint sellTotalPBL
    // ) {
    //     require(bytes(tokens[tokenAddress].symbol).length > 0);

    //     symbol = tokens[tokenAddress].symbol;

    //     (buyTotalTokens, buyTotalPBL) = countBuyOrders(tokenAddress);
    //     (sellTotalTokens, sellTotalPBL) = countSellOrders(tokenAddress);
    // }

    // function countBuyOrders(address tokenAddress) public view returns (uint totalTokens, uint totalPBL) {
    //     return countOrders(BUY, tokenAddress);
    // }

    // function countSellOrders(address tokenAddress) public view returns (uint totalTokens, uint totalPBL) {
    //     return countOrders(SELL, tokenAddress);
    // }

    // function countOrders(uint8 buyOrSell, address tokenAddress) private view returns (uint totalTokens, uint totalPBL) {
    //     mapping (address => Order) orders = tokens[tokenAddress].orders[buyOrSell];
    //     address[] memory ordersIndex = tokens[tokenAddress].ordersIndex[buyOrSell];

    //     for (uint i = 0; i < ordersIndex.length; i++) {
    //         address trader = ordersIndex[i];
    //         totalTokens = SafeMath.add(totalTokens, orders[trader].amountTokens);
    //         totalPBL = SafeMath.add(totalPBL, SafeMath.mul(orders[trader].amountTokens, orders[trader].pricePBL));
    //     }
    // }

    function getBuyOrder(address _tokenAddress, bytes16 _id) public view returns (uint, uint) {
        return getOrder(BUY, _tokenAddress, _id);
    }

    function getSellOrder(address _tokenAddress, bytes16 _id) public view returns (uint, uint) {
        return getOrder(SELL, _tokenAddress, _id);
    }

    function getOrder(uint8 _buyOrSell, address _tokenAddress, bytes16 _id) private view returns (uint, uint) {
        require(_buyOrSell == BUY || _buyOrSell == SELL);
        require(bytes(tokens[_tokenAddress].symbol).length > 0);

        mapping (bytes16 => Order) orders = tokens[_tokenAddress].orders[_buyOrSell];

        return (orders[_id].amountTokens, orders[_id].pricePbl);
    }

    function getBuyOrders(address _tokenAddress) public view returns (bytes16[]) {
        return getOrders(BUY, _tokenAddress);
    }

    function getSellOrders(address _tokenAddress) public view returns (bytes16[]) {
        return getOrders(SELL, _tokenAddress);
    }

    function getOrders(uint8 _buyOrSell, address _tokenAddress) private view returns (bytes16[]) {
        require(_buyOrSell == BUY || _buyOrSell == SELL);
        require(bytes(tokens[_tokenAddress].symbol).length > 0);

        return tokens[_tokenAddress].ordersIndex[_buyOrSell];
    }

    function placeBuyOrder(address _tokenAddress, uint _amountTokens, uint _pricePbl) public returns (bytes16) {
        uint totalPbl = SafeMath.mul(_amountTokens, _pricePbl);

        require(SafeMath.add(totalPbl, pblEncumberanceOf(msg.sender)) <= pblBalanceOf(msg.sender), "Insufficient PBL balance");

        bytes16 id = placeOrder(BUY, _tokenAddress, _amountTokens, _pricePbl);
        pblEncumberance[msg.sender] = SafeMath.add(pblEncumberance[msg.sender], totalPbl);

        emit BuyOrderCreated(id, _tokenAddress, msg.sender, _amountTokens, _pricePbl);

        return id;
    }

    function placeSellOrder(address _tokenAddress, uint _amountTokens, uint _pricePbl) public returns (bytes16) {
        require(SafeMath.add(_amountTokens, tokenEncumberanceOf(_tokenAddress, msg.sender)) <= tokenBalanceOf(_tokenAddress, msg.sender), "Insufficient book token balance");

        bytes16 id = placeOrder(SELL, _tokenAddress, _amountTokens, _pricePbl);

        tokenEncumberance[msg.sender][_tokenAddress] = SafeMath.add(tokenEncumberance[msg.sender][_tokenAddress], _amountTokens);

        emit SellOrderCreated(id, _tokenAddress, msg.sender, _amountTokens, _pricePbl);

        return id;
    }

    function placeOrder(uint8 _buyOrSell, address _tokenAddress, uint _amountTokens, uint _pricePbl) private returns (bytes16) {
        require(_buyOrSell == BUY || _buyOrSell == SELL);
        require(bytes(tokens[_tokenAddress].symbol).length > 0);
        require(_amountTokens > 0);
        require(_pricePbl > 0);

        mapping (bytes16 => Order) orders = tokens[_tokenAddress].orders[_buyOrSell];
        bytes16[] storage ordersIndex = tokens[_tokenAddress].ordersIndex[_buyOrSell];

        bytes16 id = bytes16(keccak256(abi.encodePacked(block.number, msg.sender, _tokenAddress, _buyOrSell, _amountTokens, _pricePbl)));

        // collision?
        require(orders[id].pricePbl == 0);

        orders[id].owner = msg.sender;
        orders[id].amountTokens = _amountTokens;
        orders[id].pricePbl = _pricePbl;
        orders[id].index = ordersIndex.push(id) - 1;

        return id;
    }

    function cancelBuyOrder(address _tokenAddress, bytes16 _id) public {
        uint totalPbl = SafeMath.mul(tokens[_tokenAddress].orders[BUY][_id].amountTokens, tokens[_tokenAddress].orders[BUY][_id].pricePbl);

        cancelOrder(BUY, _tokenAddress, _id);

        pblEncumberance[msg.sender] = SafeMath.sub(pblEncumberance[msg.sender], totalPbl);

        emit BuyOrderCanceled(_id, _tokenAddress);
    }

    function cancelSellOrder(address _tokenAddress, bytes16 _id) public {
        uint amountTokens = tokens[_tokenAddress].orders[BUY][_id].amountTokens;

        cancelOrder(SELL, _tokenAddress, _id);

        tokenEncumberance[msg.sender][_tokenAddress] = SafeMath.sub(tokenEncumberance[msg.sender][_tokenAddress], amountTokens);

        emit SellOrderCanceled(_id, _tokenAddress);
    }

    function cancelOrder(uint8 _buyOrSell, address _tokenAddress, bytes16 _id) private {
        require(_buyOrSell == BUY || _buyOrSell == SELL);

        Token storage token = tokens[_tokenAddress];
        require(bytes(token.symbol).length > 0);

        mapping (bytes16 => Order) orders = token.orders[_buyOrSell];
        bytes16[] storage ordersIndex = token.ordersIndex[_buyOrSell];

        require(orders[_id].owner == msg.sender);

        uint rowToDelete = orders[_id].index;
        bytes16 keyToMove = ordersIndex[ordersIndex.length - 1];
        ordersIndex[rowToDelete] = keyToMove;
        orders[keyToMove].index = rowToDelete;
        ordersIndex.length--;
    }

    // sell tokens for PBLs
    function fulfillBuyOrder(address _tokenAddress, bytes16 _id, uint _amountTokens) public {
        Token storage token = tokens[_tokenAddress];

        require(bytes(token.symbol).length > 0);
        require(_amountTokens > 0);

        mapping (bytes16 => Order) orders = token.orders[BUY];
        bytes16[] storage ordersIndex = token.ordersIndex[BUY];

        Order storage order = orders[_id];

        require(order.pricePbl > 0);
        require(tokenBalance[msg.sender][_tokenAddress] >= _amountTokens);

        uint maxTokens = _amountTokens < order.amountTokens ? _amountTokens : order.amountTokens;
        uint totalPbl = SafeMath.mul(maxTokens, order.pricePbl);

        // TODO: encumberance

        require(pblBalance[order.owner] >= totalPbl);

        tokenBalance[order.owner][_tokenAddress] = SafeMath.add(tokenBalance[order.owner][_tokenAddress], maxTokens);
        pblBalance[msg.sender] = SafeMath.add(pblBalance[msg.sender], totalPbl);

        if (maxTokens == order.amountTokens) {
            uint rowToDelete = orders[_id].index;
            bytes16 keyToMove = ordersIndex[ordersIndex.length - 1];
            ordersIndex[rowToDelete] = keyToMove;
            orders[keyToMove].index = rowToDelete;
            ordersIndex.length--;
        } else {
            order.amountTokens = SafeMath.sub(order.amountTokens, maxTokens);
        }

        // TODO: encumberance

        emit BuyOrderFulfilled(_id, _tokenAddress, msg.sender);
    }

    // buy tokens for PBLs
    function fulfillSellOrder(address _tokenAddress, bytes16 _id, uint _amountTokens) public {
        Token storage token = tokens[_tokenAddress];

        require(bytes(token.symbol).length > 0);
        require(_amountTokens > 0);

        mapping (bytes16 => Order) orders = token.orders[SELL];
        bytes16[] storage ordersIndex = token.ordersIndex[SELL];

        Order storage order = orders[_id];

        require(order.pricePbl > 0);

        uint maxTokens = _amountTokens < order.amountTokens ? _amountTokens : order.amountTokens;
        uint totalPbl = SafeMath.mul(maxTokens, order.pricePbl);

        // TODO: encumberance

        require(pblBalance[msg.sender] >= totalPbl);

        tokenBalance[msg.sender][_tokenAddress] = SafeMath.add(tokenBalance[msg.sender][_tokenAddress], maxTokens);
        pblBalance[order.owner] = SafeMath.add(pblBalance[order.owner], totalPbl);

        if (maxTokens == order.amountTokens) {
            uint rowToDelete = orders[_id].index;
            bytes16 keyToMove = ordersIndex[ordersIndex.length - 1];
            ordersIndex[rowToDelete] = keyToMove;
            orders[keyToMove].index = rowToDelete;
            ordersIndex.length--;
        } else {
            order.amountTokens = SafeMath.sub(order.amountTokens, maxTokens);
        }

        // TODO: encumberance

        emit SellOrderFulfilled(_id, _tokenAddress, msg.sender);
    }

}