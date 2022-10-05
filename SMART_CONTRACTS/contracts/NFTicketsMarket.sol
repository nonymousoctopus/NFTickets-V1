// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


import "./NFTicketsToken.sol";
import "./NFTicketsMarket.sol";
import "./NFTicketsUtils.sol";
//

//Custom Errors
error Not20PercentOfListing(); // "Listing fee must equal 20% of expected sales"
error NotEnoughTokensForListing(); // "You don't own enough for this sale"
error NoLongerOnSale(); // "No longer on sale"
error NotEnoughItemsForSale(); // "There are no more items to sell"
error NotAskingPrice(); // "Please submit the asking price in order to complete the purchase"
error ItemNotListed(); // "This item hasn't been listed yet"
error ItemSoldOut(); // "This item has sold out, create a new listing"
error NotOriginalSeller(); // "Only the original seller can relist"
error InvalidSignatureLength(); // "invalid signature length"
error InvalidStatus(); // "Invalid status"
error SellerOnlyFunction(); // "Only for seller"
error NoSales(); // "No Sales"
error NothingToRefund(); // "Nothing to refund"
error NotDisputed(); // "Not in dispute"
error NoBuyers(); // "No Buyers"
error NotOwner();


//contract NFTicketsMarket is ReentrancyGuard, ERC1155Holder, NFTicketsUtilities {
contract NFTicketsMarket is ReentrancyGuard, ERC1155Holder {
    using Counters for Counters.Counter;
    // ********* These can revert back to private soon **********
    Counters.Counter public _itemIds;
    Counters.Counter public _itemsSold;

    address payable immutable owner; // The contract owner is going to remain unchanged
    //uint256 listingPrice = 1 ether;
    uint256 constant listingFee = 5; // used to divide the price an get to the percentage i.e. 20%
    uint256 constant successFee = 4; // used to divide the listing fees and chare the seller 5% in undisputed transactions

    //AggregatorV3Interface internal priceFeed;
    
    constructor(address _owner) {
        //owner = payable(msg.sender); // This needs to be looked at - the owner is not used anywhere yet and should be a higher level contract
        owner = payable(_owner);
        //priceFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD); //Address of Oracle pricefeed - used to convert USD prices listed for each item into the native chain token price i.e. in AVAX
    }

    // Adding Utilities functionality with less bytecode
    NFTicketsUtils utils;
    // Adding Utilities functionality with less bytecode
    function Existing(address _utils) public {
        utils = NFTicketsUtils(_utils);
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
        uint256 initialQuantity;
        uint256 totalSales;
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

    mapping(uint256 => MarketItem) private idToMarketItem; //Maps each market item
    mapping(uint256 => address[]) internal marketItemIdToBuyers; // Maps each market item to an array of addresses that purchased the item
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
        uint256 initialQuantity,
        uint256 totalSales,
        bool onSale,
        uint8 status
    );
  
    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // ********** Need to ensure the listing fee distribution methods are looked into **********
    // This lists a new item onto the market - the seller must pay 20% fee calculated based of the per ticket price and number of tickets placed for sale
    function listNewMarketItem(address nftContract, uint256 tokenId, uint256 amount, bytes memory data, string memory name) public payable nonReentrant {
        //if(msg.value != (getConversion(utils.getPrice(nftContract, tokenId)) * amount / listingFee)) { revert Not20PercentOfListing();}  // offline for testing
        if(msg.value != (utils.getPrice(nftContract, tokenId) * amount / listingFee)) { revert Not20PercentOfListing();}
        NFTicketsToken temp = NFTicketsToken(nftContract);
        if(temp.balanceOf(msg.sender, tokenId) < amount) { revert NotEnoughTokensForListing();}

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            nftContract,
            tokenId,
            name,
            payable(msg.sender),
            payable(address(0)),
            utils.getPrice(nftContract, tokenId), 
            amount,
            amount,
            0,
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
            utils.getPrice(nftContract, tokenId),
            amount,
            amount,
            0,
            true,
            0
        );    
        temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
        sellerToDepositPerItem[msg.sender][itemId] = sellerToDepositPerItem[msg.sender][itemId] + msg.value; // records how much deposit was paid by a seller/wallet for the market item
    }

    // Returns the total value spend by an address on a particular market item - needs to be come internal
    /*
    function getSpend (address spender, uint256 marketItem) public view returns (uint256) {
        return addressToSpending[spender][marketItem];
    }
    */

    // Returns the total value deposited by a seller on a particular market item listing - needs to be come internal
    function getDeposit (address depositor, uint256 marketItem) private view returns (uint256) {
        return sellerToDepositPerItem[depositor][marketItem];
    }

    // Returns the latests Native tocken price for cost conversion - i.e. 1 AVAX = XX.xx USD
    
   

    // !*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*!*
    // Buys one or more tickets from the marketplace, ensuring there are enough tickets to buy, and the buyer is paying the asking price as per current native token to USD conversion.
    // ********* Payment is automatically paid the the tickets lister. This will need to be modified so that funds remain in escrow until keeper pays out the proceeds if there are no justified complaints *********
    function buyMarketItem (address nftContract, uint256 itemId, uint256 amount, bytes memory data) public payable nonReentrant {
        if(idToMarketItem[itemId].onSale != true) { revert NoLongerOnSale();}
        if(idToMarketItem[itemId].amount < amount) { revert NotEnoughItemsForSale();}
        //if(msg.value != getConversion(idToMarketItem[itemId].price) * amount) { revert NotEnoughItemsFoeSale();} //testing with no conversion
        if(msg.value != idToMarketItem[itemId].price * amount) { revert NotAskingPrice();}

        NFTicketsToken temp = NFTicketsToken(nftContract);        
        //idToMarketItem[itemId].seller.transfer(msg.value); // payment should come to this contract for escrow - right now it pays directly to the seller - commenting out will need this functionality in the future
        addressToSpending[msg.sender][itemId] = addressToSpending[msg.sender][itemId] + msg.value; // records how much was paid by a buyer/wallet for the item id
        addBuyerToItem (itemId, msg.sender);
        temp.useUnderscoreTransfer(address(this), msg.sender, idToMarketItem[itemId].tokenId, amount, data);
        idToMarketItem[itemId].amount = idToMarketItem[itemId].amount - amount;
        idToMarketItem[itemId].totalSales = idToMarketItem[itemId].totalSales + msg.value;
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
    function findMarketItemId(address _nftContract, uint256 _tokenId) private view returns(uint) {
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
        if(findMarketItemId(nftContract, tokenId) <= 0) { revert ItemNotListed();}
        if(idToMarketItem[findMarketItemId(nftContract, tokenId)].amount == 0) { revert ItemSoldOut();}
        if(msg.sender != idToMarketItem[findMarketItemId(nftContract, tokenId)].seller) { revert NotOriginalSeller();}
        if(msg.value != (utils.getConversion(utils.getPrice(nftContract, tokenId)) * amount / listingFee)) { revert Not20PercentOfListing();}
        NFTicketsToken temp = NFTicketsToken(nftContract);
        if(temp.balanceOf(msg.sender, tokenId) < amount) { revert NotEnoughTokensForListing();}

        uint256 itemId = findMarketItemId(nftContract, tokenId);
        uint newAmount = idToMarketItem[itemId].amount + amount;
        uint256 updatedQuantity = idToMarketItem[itemId].initialQuantity + amount;
        
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            nftContract,
            tokenId,
            name,
            payable(msg.sender),
            payable(address(0)), // ******** Need to check if this needs to be payable? *********
            utils.getPrice(nftContract, tokenId), 
            newAmount,
            updatedQuantity,
            idToMarketItem[itemId].totalSales,
            true,
            0
        );
        temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
        //IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), tokenId, amount, data);  
        sellerToDepositPerItem[msg.sender][itemId] = sellerToDepositPerItem[msg.sender][itemId] + msg.value; // records how much deposit was paid by a seller/wallet for the market item
    }

    // Returns the nominal price per ticket (i.e. how much it would be in a stable coin or USD)
    /*
    function getPrice(address nftContract, uint256 tokenId) internal view returns (uint256) {
        NFTicketsToken temp = NFTicketsToken(nftContract);
        uint256 tempPrice = temp.price(tokenId); 
        return tempPrice;
    }
    */

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
    function getMessageHash(string memory _message) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    // Signs the message hash
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // Verifies that the QR code was generated by the wallet address the QR code says the ticket belongs to, and that wallet owns a ticket to the event.
    function verify(address _signer, string memory _message, bytes memory signature, uint256 _itemId, address nftContract) internal view returns (string memory _result) {
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
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // Splits the signature for the recoverSigner function
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        if(sig.length != 65) { revert InvalidSignatureLength();}
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
        2. payment distribution - DONE full to sellers
        3. refund - done
        4. complaint raising - with fee
        5. complaint processing

    */

    //****** testing area ******

    // Works out Deposit to refund in undisputed transactions
    
    function depositRefundAmount (address _depositor, uint256 _marketItem) private view returns (uint256) {
        return getDeposit(_depositor, _marketItem) - (getDeposit(_depositor, _marketItem) / successFee);
    }

    // Changes the status code of the market item - testing function only
    // ******* This function will need to become restricted to the DAO Timelock or keeper contract - _newStatus must refer to the decision from the DAO Governor / Controller *******
    function changeStatus (uint256 _marketItem, uint8 _newStatus) public onlyOwner {
        if(_newStatus < 0 || _newStatus >= 7) { revert InvalidStatus();}
        idToMarketItem[_marketItem].status = _newStatus;
    }

    // Sets market item to no longer on sale - need to update who can do this/when this happens
    // ******* The buyMarketItem need to check if sale is still running (if the current time is equal or greater than event finish time) but not execute this function if the current time is equal or greater than event finish time *******
    // ******* This must be restricted to DAO Timelock / keeper *******
    function finishSale (uint256 _marketItem) public onlyOwner {
        if(idToMarketItem[_marketItem].onSale != true) { revert NoLongerOnSale();}
        idToMarketItem[_marketItem].onSale = false;
    }

    //function to pay the seller - work out deposit refund, total sales, combine both and pay out, update deposit amount and sales amount to 0
    // ************* Need to make this onlyOwner ********
    function paySellers () public payable onlyOwner nonReentrant{ 
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        // Determine how many items there are to be processed
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].onSale == false && (idToMarketItem[i + 1].status == 0 || idToMarketItem[i + 1].status == 3 || idToMarketItem[i + 1].status == 6)) { // check to make sure the item is no longer on sale // check to make sure the item is not in dispute - this needs to be updated to include status codes 3 & 6
                itemCount += 1;
            }
        }

        // Create an array of only the item ids that need to be processed at this time
        uint256[] memory itemsForProcessing = new uint256[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].onSale == false && (idToMarketItem[i + 1].status == 0 || idToMarketItem[i + 1].status == 3 || idToMarketItem[i + 1].status == 6)) {
                itemsForProcessing[currentIndex] = idToMarketItem[i + 1].itemId;
                currentIndex += 1;
            }
        }
    
        for (uint i = 0; i < itemCount; i++) {
            uint256 owedToSeller = idToMarketItem[itemsForProcessing[i]].totalSales + depositRefundAmount(idToMarketItem[itemsForProcessing[i]].seller, itemsForProcessing[i]); // Add up all sales for this item with the deposit amount to be refunded
            idToMarketItem[itemsForProcessing[i]].totalSales = 0; // Clear out total sales figure
            sellerToDepositPerItem[idToMarketItem[itemsForProcessing[i]].seller][itemsForProcessing[i]] = 0; // Clear out deposits figure
            idToMarketItem[itemsForProcessing[i]].seller.transfer(owedToSeller); // Transfer ballance owed to the seller (5% commision has be subtracted)           
            idToMarketItem[itemsForProcessing[i]].status = 1; // Set the market item status to processed so it won't be looked at again - this line is causing the issue but it seems to only mark the paid ones as processed ???
        }
    }

    // Checks the status id of a market item ( 0 Unprocessed, 1 Seller paid, 2 In dispute, 3 Porcessed - Dispute resolved in seller's favour, 4 Porcessed - Dispute resolved in buyer's favour, 5 Dispute raised to DAO, 6 Porcessed.
    /*
    function checkStatus (uint256 itemId) public view returns (uint8) {
        return idToMarketItem[itemId].status;
    }
    */

    // Adds the buyers wallet address to array of buyers of that Market Item
    function addBuyerToItem (uint256 marketItem, address buyer) internal {
        bool already = false;
        if (marketItemIdToBuyers[marketItem].length == 0) {
            marketItemIdToBuyers[marketItem].push(buyer);
             already = true;
        } else {
            uint256 totalBuyers = marketItemIdToBuyers[marketItem].length;
            for (uint i = 0; i < totalBuyers; i++){ 
                if (marketItemIdToBuyers[marketItem][i] == buyer) {
                    already = true;                
                } 
            }
        }
        if (already == false) {
            marketItemIdToBuyers[marketItem].push(buyer);
        }
    }

    // Returns all addresses of buyers of a market item - making this private saves on contract size
    /*
    function checkBuyers (uint256 marketItem) public view returns (address[] memory) {
        return marketItemIdToBuyers[marketItem];
    }
    */

    // Seller refunds all buyers for a market item - all spending records reset to 0
    function sellerRefundAll (uint256 marketItem) public onlyOwner nonReentrant {
        if(msg.sender != idToMarketItem[marketItem].seller) { revert SellerOnlyFunction();}
        if(idToMarketItem[marketItem].initialQuantity == idToMarketItem[marketItem].amount) { revert NoSales();}
        uint256 totalBuyers = marketItemIdToBuyers[marketItem].length;
        for (uint i = 0; i < totalBuyers; i++){
            payable(marketItemIdToBuyers[marketItem][i]).transfer(addressToSpending[marketItemIdToBuyers[marketItem][i]][marketItem]);
            addressToSpending[marketItemIdToBuyers[marketItem][i]][marketItem] = 0;
        }
        idToMarketItem[marketItem].name = string.concat("Refunded: ", idToMarketItem[marketItem].name);
        idToMarketItem[marketItem].status = 6;
    }

    // Seller refunds one buyer for a market item - buyer's spending records reset to 0, does not refund other buyers 
    //function sellerRefundOne (uint256 marketItem, address buyer) public nonReentrant {
    //    if(msg.sender != idToMarketItem[marketItem].seller) { revert SellerOnlyFunction();}
    //   if(addressToSpending[buyer][marketItem] <= 0) { revert NothingToRefund();}
    //    payable(buyer).transfer(addressToSpending[buyer][marketItem]);
    //    addressToSpending[buyer][marketItem] = 0;  
    //}

    function sellerRefundOne (uint256 marketItem, address buyer) public nonReentrant {
        if(msg.sender != idToMarketItem[marketItem].seller) { revert SellerOnlyFunction();}
        utils.sellerRefundOneUtils(marketItem, buyer);
        addressToSpending[buyer][marketItem] = 0;  
    }

    // DAO Timelock / Keeper slashed seller's deposit, half goes to DAO, half gets distributed to buyers in proportion, all payments refunded
    // ******* Need to make this something only the DAO Timelock/Keeper can implement after a vote
    function refundWithPenalty (uint256 marketItem) public nonReentrant {
        if(idToMarketItem[marketItem].status != 4) { revert NotDisputed();}
        if(marketItemIdToBuyers[marketItem].length <= 0) { revert NoBuyers();}

        uint256 depositShare = (getDeposit(idToMarketItem[marketItem].seller, marketItem) / 2) / marketItemIdToBuyers[marketItem].length; // works out share of total deposit - in this event the seller forfits their entire deposit amount - half to DAO and half to buyers
        
        uint256 totalBuyers = marketItemIdToBuyers[marketItem].length;
        for (uint i = 0; i < totalBuyers; i++){
            payable(marketItemIdToBuyers[marketItem][i]).transfer(addressToSpending[marketItemIdToBuyers[marketItem][i]][marketItem] + depositShare);
            addressToSpending[marketItemIdToBuyers[marketItem][i]][marketItem] = 0;
        }
        sellerToDepositPerItem[idToMarketItem[marketItem].seller][marketItem] = 0;
        idToMarketItem[marketItem].name = string.concat("Refunded: ", idToMarketItem[marketItem].name);
    }

    // Basic Access control
    modifier onlyOwner {
        if(msg.sender != owner) {revert NotOwner();}
        _;
    }


    // NEED TO ADD A FUNCTION TO RAISE DISPUTE
    //****** testing area ******
    
}
