// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./NFTicketsMarket.sol";

contract NFTicketsMockDAO {

    NFTicketsMarket market;
    
    function Existing(address _market) public {
        market = NFTicketsMarket(_market);
    }

    function complaint (uint256 _marketItem) public {
        market.changeStatus( _marketItem, 2);
    }
}