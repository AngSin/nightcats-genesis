// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// Uncomment this line to use console.log
//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NightCatsGenesis is ERC721A, Ownable {
    // minting
    uint256 public mintPrice = 0.03 ether;
    bytes32 public wlHex;

//    function setMintPrice(uint256 )
    constructor() ERC721A("NightCatsGenesis", "GCATS") {}

    function setWlHex(bytes32 _wlHex) public onlyOwner {
        wlHex = _wlHex;
    }

    function isValid(bytes32[] memory _proof, bytes32 _leaf) internal view returns(bool) {
        return MerkleProof.verify(_proof, wlHex, _leaf);
    }

    function mint(bytes32[] memory _proof) public view returns(string memory) {
        require(isValid(_proof, keccak256(abi.encodePacked(msg.sender))), "You are not whitelisted!");
        return "hi";
    }

}
