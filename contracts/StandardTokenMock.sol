pragma solidity ^0.4.17;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract StandardTokenMock is StandardToken {
    function gimme(uint _value) public {
        balances[msg.sender] += _value;
        totalSupply_ += _value;
    }
}
