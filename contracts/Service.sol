// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ServicePurchase is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address marketAddress;
    address owner;

    event newToken();

    constructor(address _marketAddress) payable ERC721 ("Service Token", "SRVC") {
        marketAddress = _marketAddress;
    }
    
    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(marketAddress, true);
        emit newToken();
        return newItemId;
    }

}