// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

contract NFTicketsTok is ERC20Snapshot {
    uint256 public constant s_maxSupply = 1000000000000000000000000;
    constructor () 
    ERC20("NFTicketsToken", "NFTK") 

    {
        _mint(msg.sender, s_maxSupply);
        _snapshot();
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        _snapshot();
        return true;
    }

    function getSnapshot() public view returns (uint256) {
        return _getCurrentSnapshotId();
    }

    /*
        Need to make the name and Symbol set via constructor
    */
}