// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

import "./NFTicketsToken.sol";

contract NFTicketsMarket is ReentrancyGuard, ERC1155Holder {
    using Counters for Counters.Counter;
    // ********* These can revert back to private soon **********
    Counters.Counter public _itemIds;
    Counters.Counter public _itemsSold;

    address payable immutable owner; // The contract owner is going to remain unchanged
    uint256 listingPrice = 1 ether;
    uint256 listingFee = 5; // used to divide the price an get to the percentage i.e. 20%
    //Temp variable to simulate pricefeed data

    AggregatorV3Interface internal priceFeed;
    
    constructor() {
        owner = payable(msg.sender); // This needs to be looked at - the owner is not used anywhere yet and should be a higher level contract
        priceFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD); //Address of Oracle pricefeed - used to convert USD prices listed for each item into the native chain token price i.e. in AVAX
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        string name;
        address payable seller;
        address payable owner; // ********* does the owner need to be payable? ********
        uint256 price;
        uint256 amount;
        bool onSale;
        uint8 status;
        /* Status codes
        0 Unprocessed
        1 Seller paid (and most of listing fee refunded)
        2 In dispute (complaint raised)
        3 Porcessed - Dispute resolved in seller's favour - buyer penalised (can be automated or by DAO vote)
        4 Porcessed - Dispute resolved in buyer's favour - seller penalised (can be automated or by DAO vote)
        5 Dispute raised to DAO - await extra time
        6 Porcessed - Refunded by seller - seller will need to select this once dispute is raised - most of the listing fee will be refunded to seller
        */
    }

    struct MyItems {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 amount;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(address => mapping(uint256 => uint256)) public addressToSpending; // Maps how much each address has spent on each item
    mapping(address => mapping(uint256 => uint256)) public sellerToDepositPerItem; // Maps how much each seller has deposited per peach market item


    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        string name,
        address seller,
        address owner,
        uint256 price,
        uint256 amount, 
        bool onSale,
        uint8 status
    );
  
    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ********** Need to ensure the listing fee distribution methods are looked into **********
    // This lists a new item onto the market - the seller must pay 20% fee calculated based of the per ticket price and number of tickets placed for sale
    function listNewMarketItem(address nftContract, uint256 tokenId, uint256 amount, bytes memory data, string memory name) public payable nonReentrant {
        //require(msg.value == (getConversion(getPrice(nftContract, tokenId)) * amount / listingFee), "Listing fee must equal 20% of expected sales"); // offline for testing
        require(msg.value == (getPrice(nftContract, tokenId) * amount / listingFee), "Listing fee must equal 20% of expected sales");
        NFTicketsToken temp = NFTicketsToken(nftContract);
        require(temp.balanceOf(msg.sender, tokenId) >= amount, "You don't own enough for this sale");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            nftContract,
            tokenId,
            name,
            payable(msg.sender),
            payable(address(0)),
            getPrice(nftContract, tokenId), 
            amount,
            true,
            0
        );

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            name,
            msg.sender,
            address(0),
            getPrice(nftContract, tokenId),
            amount,
            true,
            0
        );    
        temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
        sellerToDepositPerItem[msg.sender][itemId] = addressToSpending[msg.sender][itemId] + msg.value; // records how much deposit was paid by a seller/wallet for the market item
    }

    // Returns the total value spend by an address on a particular market item
    function getSpend (address spender, uint256 marketItem) public view returns (uint256) {
        return addressToSpending[spender][marketItem];
    }

    // Returns the total value deposited by a seller on a particular market item listing
    function getDeposit (address depositor, uint256 marketItem) public view returns (uint256) {
        return addressToSpending[depositor][marketItem];
    }

    // Returns the latests Native tocken price for cost conversion - i.e. 1 AVAX = XX.xx USD
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

    // Converts the given price in USD into the actual price in native chain token (i.e. AVAX), taking into account he decimal places
    function getConversion (uint256 _price) public view returns (uint256 conversion) {
        uint256 dataFeed = uint256(getLatestPrice()); //this will be the token to USD exchange rate from the pricefeed
        uint256 multiplier = 100000; //this will get it to the right number of decimal places assuming that the price passed by the app could have cents - and has been multiplied by 100 to remove decimal places.
        return conversion = _price * dataFeed * multiplier;
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // Buys one or more tickets from the marketplace, ensuring there are enough tickets to buy, and the buyer is paying the asking price as per current native token to USD conversion.
    // ********* Payment is automatically paid the the tickets lister. This will need to be modified so that funds remain in escrow until keeper pays out the proceeds if there are no justified complaints *********
    function buyMarketItem (address nftContract, uint256 itemId, uint256 amount, bytes memory data) public payable nonReentrant {
        require(idToMarketItem[itemId].amount > 0, "There are no more items to sell");
        //require(msg.value == getConversion(idToMarketItem[itemId].price) * amount, "Please submit the asking price in order to complete the purchase");//testing with no conversion
        require(msg.value == idToMarketItem[itemId].price * amount, "Please submit the asking price in order to complete the purchase");//updated with conversion
        NFTicketsToken temp = NFTicketsToken(nftContract);        
        //idToMarketItem[itemId].seller.transfer(msg.value); // payment should come to this contract for escrow - right now it pays directly to the seller - commenting out will need this functionality in the future
        addressToSpending[msg.sender][itemId] = addressToSpending[msg.sender][itemId] + msg.value; // records how much was paid by a buyer/wallet for the item id
        temp.useUnderscoreTransfer(address(this), msg.sender, idToMarketItem[itemId].tokenId, amount, data);
        idToMarketItem[itemId].amount = idToMarketItem[itemId].amount - amount;
        idToMarketItem[itemId].owner = payable(msg.sender); // *********** This actually makes the buyer listed as the owner - but it only means they are the last buyer or the last to become an owner of this NFT - NEEDS LOOKING INTO
        if(idToMarketItem[itemId].amount == 0){
            _itemsSold.increment();
            idToMarketItem[itemId].onSale = false;
        }
    }

    // Returns array of information from the MarketItem Struct - used by the front end to display relevant data
    function getMarketItem(uint256 marketItemId) public view returns (MarketItem memory) {
        return idToMarketItem[marketItemId];
    }

    // Returns number of remaining tickets on sale on the Market for a particular market listing
    function checkRemaining (uint256 id) public view returns (uint256) {
        return idToMarketItem[id].amount;
    }

    // Returns all items currently on sale on the market including all the data of each item
    function fetchItemsOnSale() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].onSale == true) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ******** Need to check if the below description is accurate - does this function actually fail or does it return the market items that are owned by the msg.sender? **********
    // ******** Need to update this because the owner field can be reset - should be checking using the balanceOf function of the IERC1155 standard i.e. balanceOf(msg.sender, MarketItem.tokenId)
    //This function will need to be rewritten as the owner field will no longer accurately reflect
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Finds makret items using the tokenId of the NFT - useful to determine if any current listings exist
    function findMarketItemId(address _nftContract, uint256 _tokenId) public view returns(uint) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].nftContract == _nftContract && idToMarketItem[i + 1].tokenId == _tokenId) {
                    itemCount = i + 1;
            }
        }
        return itemCount;
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ********** Need to ensure the listing fee distribution methods are looked into **********
    // Lists additional tickets to the market item if a listing on the market is still open and has tickets remaining on sale
    // Checks if the item has already been listed, if the listing is still active, ensures only the original lister can add more tickets and ensures listing fee is paid to the marketplace.
    function listMoreOfMarketItem(address nftContract, uint256 tokenId, uint256 amount, bytes memory data, string memory name) public payable nonReentrant {
        require(findMarketItemId(nftContract, tokenId) > 0, "This item hasn't been listed yet");
        require(idToMarketItem[findMarketItemId(nftContract, tokenId)].amount > 0, "This item has sold out, create a new listing");
        require(msg.sender == idToMarketItem[findMarketItemId(nftContract, tokenId)].seller, "Only the original seller can relist");
        require(msg.value == (getConversion(getPrice(nftContract, tokenId)) * amount / listingFee), "Listing fee must equal 20% of expected sales");// updated with conversion
        NFTicketsToken temp = NFTicketsToken(nftContract);
        require(temp.balanceOf(msg.sender, tokenId) >= amount, "You don't own enough for this sale");

        uint256 itemId = findMarketItemId(nftContract, tokenId);
        uint newAmount = idToMarketItem[itemId].amount + amount;
        
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            nftContract,
            tokenId,
            name,
            payable(msg.sender),
            payable(address(0)), // ******** Need to check if this needs to be payable? *********
            getPrice(nftContract, tokenId), 
            newAmount,
            true,
            0
        );
        temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
        //IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), tokenId, amount, data);  
        sellerToDepositPerItem[msg.sender][itemId] = addressToSpending[msg.sender][itemId] + msg.value; // records how much deposit was paid by a seller/wallet for the market item
    }

    // Returns the nominal price per ticket (i.e. how much it would be in a stable coin or USD)
    function getPrice(address nftContract, uint256 tokenId) public view returns (uint256) {
        NFTicketsToken temp = NFTicketsToken(nftContract);
        uint256 tempPrice = temp.price(tokenId); 
        return tempPrice;
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ******** Is the below comment still relevant? ********
    //fetch market items needs to be rewritten as it resets to all zeroes 

    // Runs through all listings on the market and checks how many belong to the user
    function fetchUserNFTs(address user) public view returns (MyItems[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
    
        for (uint i = 0; i < totalItemCount; i++) {
            NFTicketsToken temp = NFTicketsToken(idToMarketItem[i +1].nftContract); 
            if (temp.balanceOf(user, idToMarketItem[i + 1].tokenId) > 0) {
                itemCount += 1;
            }
        }

        MyItems[] memory personalItems = new MyItems[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            NFTicketsToken temp = NFTicketsToken(idToMarketItem[i +1].nftContract); 
            if (temp.balanceOf(user, idToMarketItem[i + 1].tokenId) > 0) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                personalItems[currentIndex] = MyItems(currentItem.itemId, currentItem.nftContract, currentItem.tokenId, currentItem.price, temp.balanceOf(user, idToMarketItem[i + 1].tokenId));
                currentIndex += 1;
            }
        }
        return personalItems;
    }


    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // This section deals with checking if the ticket (QR) presenter is actually the owner of the ticket

    // Generates a hash for a message
    function getMessageHash(string memory _message) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    // Signs the message hash
    function getEthSignedMessageHash(bytes32 _messageHash)
        public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
    }

    // Verifies that the QR code was generated by the wallet address the QR code says the ticket belongs to, and that wallet owns a ticket to the event.
    function verify(address _signer, string memory _message, bytes memory signature, uint256 _itemId, address nftContract) public view returns (string memory _result) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        //This is the address used for testing that is being checked - will actually be list of NFT owners in real app
        //address _testAddress = 0xc88Ad52065A113EbE503a4Cb6bCcE02B4802c264;
        NFTicketsToken temp = NFTicketsToken(nftContract);
        _result = "Not on the list";
        if (temp.balanceOf(_signer, idToMarketItem[_itemId].tokenId) > 0 && (recoverSigner(ethSignedMessageHash, signature) == _signer)) {
            _result = "On the list";
        } 
        return _result;
    }

    // Determines which wallet signed the message hash
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // Splits the signature for the recoverSigner function
    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))  
            s := mload(add(sig, 64))  
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ******* Need to update this to ensure that the _message that is being hashed is not using the name of the event but rather a unique identifier such as the marketItem itemId *********
    // ******* Need to rename this funciton to a more appropriate name like confirmTicketAuthenticity
    // Allows the host or ticket checker to check the QR code and ensure the ticket holder is on the list, and that the QR code was generated by the wallet that is on the list for the event.
    function hostActions(uint256 _itemId, bytes memory _sig, address nftContract) public view returns (string memory) {
        string memory _message = idToMarketItem[_itemId].name; // This needs to be updated - need to stop using the name of the event as there could be conflicts - need to use the itemId from the marketItem
        bytes32 _messageHash = getMessageHash(_message);
        bytes32 _ethSignedMessageHash = getEthSignedMessageHash(_messageHash);
        address _signer = recoverSigner(_ethSignedMessageHash, _sig);
        return verify(_signer, _message, _sig, _itemId, nftContract);
    }

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ************* Need to add another function to be able to mark attendance, this will need to have a sub function to ensure only authorised people/wallets can mark attendance ********

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

    /*

        FUNCTIONS TO BE ADDED:
        function to get the timestamp of the event from the NFT on IPFS - then to convert it into block time, then compare with current block time to ensure something can be done with the funds - perhaps using UNIX time? - this is impractical - need to use oracle ane extra gas for this, better off saving the event timestamp in the NFT and checking timestamp against current time

        time delay should be something like this:
        event lister inputs the time in the front end - this is converted using javascript into unix time > uint256 > bytes
        that unix time is listed in the NFT in the data (bytes) paramter during the mint
        future functions can use the timestamp vs now to ensure enough time has passed i.e. now > data (timestamp) + 86400 (24 hours)
        if the above is true, then other function logic can be executed
        best to also have a flag on the market item to ensure that it doens't get processed again and again.

        1. payment hold - DONE - the funds are now placed into this smart contract and await distribution - buyers funds are tracked to each item, and deposits by the seller too
        2. payment distribution
        3. refund
        4. complaint raising - with fee
        5. complaint processing

    */

    //****** testing area ******

    //****** testing area ******
    
}