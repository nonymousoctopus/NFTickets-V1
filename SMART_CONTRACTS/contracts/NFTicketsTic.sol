// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";



contract NFTicketsTic is ERC1155URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address immutable marketAddress; // replaced previous testing address - now injected via constructor

    constructor(address _marketAddress) ERC1155("") {
        marketAddress = _marketAddress;
    }

    mapping (uint256 => string) private _uris;
    mapping (uint256 => address) private _tokenCreator;
    mapping (uint256 => uint256) public _price;
    mapping (uint256 => int64[2]) private coordinates;
    mapping (uint256 => uint256) private eventStartTime;
    mapping (uint256 => uint256) private eventFinishTime;

    //need to create a mapping for price that will be used in the market contract as well and price cannot be set twice - to prevent scalping

    // Returns the uri address of content on IPFS for the given tokenId
    function uri(uint256 tokenId) override public view returns (string memory) {
        return(_uris[tokenId]);
    }

    // Returns the maximum per unit price of the tokenId (i.e. per ticket)
    function price(uint256 tokenId) public view returns (uint256) {
      return(_price[tokenId]);
    }

    // Creates general admitance tokens - all have same value and no seat specific data
    function createToken(string memory tokenURI, uint256 amount, bytes memory data, uint256 price, uint256 startTime, uint256 finishTime, int64 lat, int64 lon) public nonReentrant returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        require(bytes(_uris[newItemId]).length == 0, "Cannot set URI twice");
        require((_price[newItemId]) == 0, "Cannot set price twice");
        require(price > 0, "price cannot be 0");
        _tokenCreator[newItemId] = msg.sender;
        _uris[newItemId] = tokenURI;
        _price[newItemId] = price;
        eventStartTime[newItemId] = startTime;
        eventFinishTime[newItemId] = finishTime;
        coordinates[newItemId] = [lat, lon];
        _mint(msg.sender, newItemId, amount, data);
        setApprovalForAll(marketAddress, true);
        return newItemId;
    }

    // Creates more general admitance tokens - all have samve value and no seat specific data
    function createMoreTokens(uint256 tokenId, uint256 amount, bytes memory data) public {
        require(_tokenCreator[tokenId] == msg.sender, "You are not the token creator");
        _mint(msg.sender, tokenId, amount, data);
    }

    // *********** This send function hasn't been used in the marketplace yet - tagged for possible deletion *************
    function sendFree (address to, uint256 tokenId, uint256 amount, bytes memory data) public {
        _safeTransferFrom(msg.sender, to, tokenId, amount, data);
        setApprovalForAll(to, true);
    }

    // ********* Need to rename function *********
    function useUnderscoreTransfer (address from, address to, uint256 tokenId, uint256 amount, bytes memory data) public nonReentrant {
        _safeTransferFrom(from, to, tokenId, amount, data);
    }

    // Lists all token IDs that were created by the message sender
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

    function getStartTime (uint256 tokenId) public view returns (uint256) {
        return eventStartTime[tokenId];
    }
    function getFinishTime (uint256 tokenId) public view returns (uint256) {
        return eventFinishTime[tokenId];
    }
    function getCoordinates (uint256 tokenId) public view returns (int64[2] memory) {
        return coordinates[tokenId];
    }

}