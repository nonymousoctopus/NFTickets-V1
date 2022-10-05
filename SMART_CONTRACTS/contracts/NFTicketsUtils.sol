// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NFTicketsToken.sol";
import "./NFTicketsMarket.sol";


error NothingToRefundHere();

contract NFTicketsUtils is ReentrancyGuard { 

    AggregatorV3Interface internal priceFeed;

    constructor() {
        priceFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD); //Address of Oracle pricefeed - used to convert USD prices listed for each item into the native chain token price i.e. in AVAX
    }
   
   // Converts the given price in USD into the actual price in native chain token (i.e. AVAX), taking into account he decimal places
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

   function getPrice(address nftContract, uint256 tokenId) public view returns (uint256) {
        NFTicketsToken temp = NFTicketsToken(nftContract);
        uint256 tempPrice = temp.price(tokenId); 
        return tempPrice;
    }


/*
    function getMarketItemTest(address marketContract, uint256 marketItemId) public view returns (MarketItem memory) {
        NFTicketsMarket temp = NFTicketsMarket(marketContract);
        return idToMarketItem[marketItemId];
    }

*/


    NFTicketsMarket market;
    
    function Existing(address _market) public {
        market = NFTicketsMarket(_market);
    }

    function sellerRefundOneUtils (uint256 marketItem, address buyer) public nonReentrant { //This used to be nonRentrant
        //if(msg.sender != idToMarketItem[marketItem].seller) { revert SellerOnlyFunction();}
        //return publishedContract.tests(caller, tokenId);
        if(market.addressToSpending(buyer, marketItem) <= 0) { revert NothingToRefundHere();}
        //if(addressToSpending[buyer][marketItem] <= 0) { revert NothingToRefund();}
        payable(buyer).transfer(market.addressToSpending(buyer, marketItem));
        //addressToSpending[buyer][marketItem] = 0;  
        //market.addressToSpending(buyer, marketItem) = 0;
    }


}

