// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

contract NFTickets is ERC1155URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address contractAddress = 0xF5C999A6DC302cdaC7539423d6a14dc129f0DABa; // This will need to be replaced with an address injected via the constructor

    constructor() ERC1155("") {
        //contractAddress
    }

    mapping (uint256 => string) private _uris;
    mapping (uint256 => address) private _tokenCreator;
    mapping (uint256 => uint256) public _price;

    //need to create a mapping for price that will be used in the market contract as well and price cannot be set twice - to prevent scalping

    function uri(uint256 tokenId) override public view returns (string memory) {
        return(_uris[tokenId]);
    }

    function price(uint256 tokenId) public view returns (uint256) {
      return(_price[tokenId]);
    }

    //Creates general admitance tokens - all have same value and no seat specific data
    function createToken(string memory tokenURI, uint256 amount, bytes memory data, uint256 price) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        require(bytes(_uris[newItemId]).length == 0, "Cannot set URI twice");
        require((_price[newItemId]) == 0, "Cannot set price twice");
        require(price > 0, "price cannot be 0");
        _tokenCreator[newItemId] = msg.sender;
        _mint(msg.sender, newItemId, amount, data);
        _uris[newItemId] = tokenURI;
        _price[newItemId] = price;
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }

    //Creates more general admitance tokens - all have samve value and no seat specific data
    function createMoreTokens(uint256 tokenId, uint256 amount, bytes memory data) public {
        require(_tokenCreator[tokenId] == msg.sender, "You are not the token creator");
        _mint(msg.sender, tokenId, amount, data);
    }

    //need to create a transfer function that allows transfer with payable amount no higher than original price
    function sendFree (address to, uint256 tokenId, uint256 amount, bytes memory data) public {
      _safeTransferFrom(msg.sender, to, tokenId, amount, data);
      setApprovalForAll(to, true);
    }

    function useUnderscoreTransfer (address from, address to, uint256 tokenId, uint256 amount, bytes memory data) public {
      _safeTransferFrom(from, to, tokenId, amount, data);
    }

    //Lists all token IDs that were created by the message sender
    function listMyTokens(address testMe) public view returns (uint256[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (_tokenCreator[i+1] == testMe) {
        itemCount += 1;
      }
    }

    uint256[] memory tokens = new uint256[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (_tokenCreator[i+1] == testMe) {
        tokens[currentIndex] = i+1;
        currentIndex += 1;
      }
    }
    return tokens;
  }

}

contract NFTicketsMarket is ReentrancyGuard, ERC1155Holder {
  using Counters for Counters.Counter;
  //These can revert back to private soon
  Counters.Counter public _itemIds;
  Counters.Counter public _itemsSold;

  address payable owner;
  uint256 listingPrice = 1 ether;
  uint256 listingFee = 5;
  //Temp variable to simulate pricefeed data

  AggregatorV3Interface internal priceFeed;
  
  constructor() {
    owner = payable(msg.sender);
    priceFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD);
  }

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    string name;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 amount;
    bool onSale;
  }

  struct MyItems {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    uint256 price;
    uint256 amount;
  }

  mapping(uint256 => MarketItem) private idToMarketItem;

  event MarketItemCreated (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    string name,
    address seller,
    address owner,
    uint256 price,
    uint256 amount, 
    bool onSale
  );
  
   function listNewMarketItem(address nftContract, uint256 tokenId, uint256 amount, bytes memory data, string memory name) public payable nonReentrant {
    //require(msg.value == (getPrice(nftContract, tokenId) * amount / listingFee), "Listing fee must equal 20% of expected sales");//replacing with mocked pricefeed
    require(msg.value == (getConversion(getPrice(nftContract, tokenId)) * amount / listingFee), "Listing fee must equal 20% of expected sales");// updated with conversion

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
        true
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
        true
      );

      NFTickets temp = NFTickets(nftContract);
      temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
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

  function getConversion (uint256 _price) public view returns (uint256 conversion) {
    //uint256 dataFeed = 3170211916; //this will be the pricefeed amount
    uint256 dataFeed = uint256(getLatestPrice()); //this will be the pricefeed amount
    uint256 multiplier = 100000; //this will get it to the right number of decimal places assuming that the price passed by the app coule have cents - and has been multiplied by 100 to remove decimal places.
    return conversion = _price * dataFeed * multiplier;
  }

  function buyMarketItem (address nftContract, uint256 itemId, uint256 amount, bytes memory data) public payable nonReentrant {
    require(idToMarketItem[itemId].amount > 0, "There are no more items to sell");
    require(msg.value == getConversion(idToMarketItem[itemId].price) * amount, "Please submit the asking price in order to complete the purchase");//updated with conversion
    NFTickets temp = NFTickets(nftContract); 
    idToMarketItem[itemId].seller.transfer(msg.value);
    temp.useUnderscoreTransfer(address(this), msg.sender, idToMarketItem[itemId].tokenId, amount, data);
    idToMarketItem[itemId].amount = idToMarketItem[itemId].amount - amount;
    idToMarketItem[itemId].owner = payable(msg.sender);
    if(idToMarketItem[itemId].amount == 0){
      _itemsSold.increment();
      idToMarketItem[itemId].onSale = false;
    }
  }

  function getMarketItem(uint256 marketItemId) public view returns (MarketItem memory) {
    return idToMarketItem[marketItemId];
  }

  function checkRemaining (uint256 id) public view returns (uint256) {
      return idToMarketItem[id].amount;
  }

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

  function listMoreOfMarketItem(address nftContract, uint256 tokenId, uint256 amount, bytes memory data, string memory name) public payable nonReentrant {
    require(findMarketItemId(nftContract, tokenId) > 0, "This item hasn't been listed yet");
    require(idToMarketItem[findMarketItemId(nftContract, tokenId)].amount > 0, "This item has sold out, create a new listing");
    require(msg.sender == idToMarketItem[findMarketItemId(nftContract, tokenId)].seller, "Only the original seller can relist");
    require(msg.value == (getConversion(getPrice(nftContract, tokenId)) * amount / listingFee), "Listing fee must equal 20% of expected sales");// updated with conversion

      uint256 itemId = findMarketItemId(nftContract, tokenId);
      uint newAmount = idToMarketItem[itemId].amount + amount;
    
      idToMarketItem[itemId] =  MarketItem(
        itemId,
        nftContract,
        tokenId,
        name,
        payable(msg.sender),
        payable(address(0)),
        getPrice(nftContract, tokenId), 
        newAmount,
        true
      );
    NFTickets temp = NFTickets(nftContract);
    temp.useUnderscoreTransfer(msg.sender, address(this), tokenId, amount, data);
    //IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), tokenId, amount, data);  
  }

  function getPrice(address nftContract, uint256 tokenId) public view returns (uint256) {
    NFTickets temp = NFTickets(nftContract); 
    uint256 tempPrice = temp.price(tokenId); 
    return tempPrice;
  }

  //fetch market items needs to be rewritten as it resets to all zeroes 

  function fetchUserNFTs(address user) public view returns (MyItems[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;
  
    for (uint i = 0; i < totalItemCount; i++) {
        NFTickets temp = NFTickets(idToMarketItem[i +1].nftContract); 
      if (temp.balanceOf(user, idToMarketItem[i + 1].tokenId) > 0) {
        itemCount += 1;
      }
    }

    MyItems[] memory personalItems = new MyItems[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
        NFTickets temp = NFTickets(idToMarketItem[i +1].nftContract); 
      if (temp.balanceOf(user, idToMarketItem[i + 1].tokenId) > 0) {
        uint currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        personalItems[currentIndex] = MyItems(currentItem.itemId, currentItem.nftContract, currentItem.tokenId, currentItem.price, temp.balanceOf(user, idToMarketItem[i + 1].tokenId));
        currentIndex += 1;
      }
    }
    return personalItems;
  }


  //this is the signature checking part of the contract - still need to make this work within the market place
  function getMessageHash(string memory _message) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_message));
  }

  function getEthSignedMessageHash(bytes32 _messageHash)
    public pure returns (bytes32) {
      return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
    );
  }

  //need add the token ID that's being checked by the scanner
  //then need to check balnce of for that token ID for the sender

  function verify(address _signer, string memory _message, bytes memory signature, uint256 _itemId, address nftContract) public view returns (string memory _result) {
    bytes32 messageHash = getMessageHash(_message);
    bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
    //This is the address used for testing that is being checked - will actually be list of NFT owners in real app
    //address _testAddress = 0xc88Ad52065A113EbE503a4Cb6bCcE02B4802c264;
    NFTickets temp = NFTickets(nftContract); 
    _result = "Not on the list";
    if (temp.balanceOf(_signer, idToMarketItem[_itemId].tokenId) > 0 && (recoverSigner(ethSignedMessageHash, signature) == _signer)) {
      _result = "On the list";
    } 
    return _result;
  }

  function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
    (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
    return ecrecover(_ethSignedMessageHash, v, r, s);
  }

  function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
    require(sig.length == 65, "invalid signature length");
    assembly {
      r := mload(add(sig, 32))  
      s := mload(add(sig, 64))  
      v := byte(0, mload(add(sig, 96)))
    }
  }


  //need to pass this function the token ID of the nft - this will be used to get the _message - make this the event name
  //then need to check balnce of for that token ID for the sender
  //function hostActions(string memory _message, bytes memory _sig) public pure returns (string memory) {
  function hostActions(uint256 _itemId, bytes memory _sig, address nftContract) public view returns (string memory) {
    string memory _message = idToMarketItem[_itemId].name;
    bytes32 _messageHash = getMessageHash(_message);
    bytes32 _ethSignedMessageHash = getEthSignedMessageHash(_messageHash);
    address _signer = recoverSigner(_ethSignedMessageHash, _sig);
    return verify(_signer, _message, _sig, _itemId, nftContract);
  }


}