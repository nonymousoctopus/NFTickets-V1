// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NFTicketsTic.sol";
import "./NFTicketsMarket.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


error NothingToRefundHere();

contract NFTicketsUtils is ReentrancyGuard, Ownable { 

    AggregatorV3Interface internal priceFeed;
    NFTicketsMarket public market;

    /**
     * Pricefeed: USD/AVAX on Avalanche Fuji testnet
     */

    constructor() {
        priceFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD); 
    }
   
    /**
     * Purpose: set up connection to NFTickets market contract
     */

    function setUp (address _market) public onlyOwner {
        market = NFTicketsMarket(_market);
    }

    /**
     * Purpose: Converts the given price in USD into the actual price in native chain token (i.e. AVAX), taking into account he decimal places
     */

    function getConversion (uint256 _price) public view returns (uint256 conversion) {
        uint256 dataFeed = uint256(getLatestPrice()); //this will be the token to USD exchange rate from the pricefeed
        uint256 multiplier = 100000; //this will get it to the right number of decimal places assuming that the price passed by the app could have cents - and has been multiplied by 100 to remove decimal places.
        return conversion = _price * dataFeed * multiplier;
    }

    function getLatestPrice() public view returns (int) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price;
    }

    /**
     * Purpose: gets the ticket price in USD as specified by the creator
     */

    function getPrice(address nftContract, uint256 tokenId) public view returns (uint256) {
        NFTicketsTic temp = NFTicketsTic(nftContract);
        uint256 tempPrice = temp.price(tokenId); 
        return tempPrice;
    }   

    /**
     * Purpose: Assists in refunding an individual buyer
     */

    function sellerRefundOneUtils (uint256 marketItem, address buyer) public nonReentrant { 
        if(market.addressToSpending(buyer, marketItem) <= 0) { revert NothingToRefundHere();}
        payable(buyer).transfer(market.addressToSpending(buyer, marketItem));
    }

}
