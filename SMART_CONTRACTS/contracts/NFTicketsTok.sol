// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

contract NFTicketsTok is ERC20Snapshot {

    /**
     * Token name: NFTicketsToken
     * Token symbol: NFTK
     * Supply: 1,000,000 (1 million tokens)
     * Set up: Creator receives entire supply of tokens, first snapshot is taken
     */

    uint256 public constant s_maxSupply = 1e24; // 1 million tokens
    constructor () 
    ERC20("NFTicketsToken", "NFTK") 

    {
        _mint(msg.sender, s_maxSupply);
        _snapshot();
    }

    /**
     * Modifications: each transfer will capture a snapshot for voting purposes
     */

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        _snapshot();
        return true;
    }

    function getSnapshot() public view returns (uint256) {
        return _getCurrentSnapshotId();
    }
}