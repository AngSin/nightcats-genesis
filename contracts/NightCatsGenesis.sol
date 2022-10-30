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
    uint256 public premintSupply = 33;
    uint256 public reserveSupply = 33;
    uint256 public publicSupply = 267;
    uint256 public maxPerWallet = 1;
    mapping(address => uint256) mintedCount;

    // whitelisting hex
    bytes32 public wlHex;

    // minting flags
    bool public isPreMintComplete = false;
    bool public isWlMintLive = false;
    bool public isOpenMintLive = false;

    constructor() ERC721A("NightCatsGenesis", "GCATS") {}

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setMaxPerWallet(uint256 _maxPerWallet) public onlyOwner {
        maxPerWallet = _maxPerWallet;
    }

    function setWlHex(bytes32 _wlHex) public onlyOwner {
        wlHex = _wlHex;
    }

    function setPremintSupply(uint256 _premintSupply) public onlyOwner {
        premintSupply = _premintSupply;
    }

    function setReserveSupply(uint256 _reserveSupply) public onlyOwner {
        reserveSupply = _reserveSupply;
    }

    function setPublicSupply(uint256 _publicSupply) public onlyOwner {
        if (isPreMintComplete) {
            publicSupply = _publicSupply;
        }
    }

    function setIsWlMintLive(bool _isWlMintLive) public onlyOwner {
        if (isPreMintComplete) {
            isWlMintLive = _isWlMintLive;
        }
    }

    function setIsOpenMintLive(bool _isOpenMintLive) public onlyOwner {
        if (isPreMintComplete) {
            isOpenMintLive = _isOpenMintLive;
        }
    }

    function isValid(bytes32[] memory _proof, bytes32 _leaf) internal view returns(bool) {
        return MerkleProof.verify(_proof, wlHex, _leaf);
    }

    function premint() public onlyOwner {
        require (isPreMintComplete == false, "Reserve is already minted!");
        isPreMintComplete = true;
        super._safeMint(msg.sender, premintSupply);
    }

    function mint(bytes32[] memory _proof) public payable {
        require(isPreMintComplete, "Premint supply has not yet been minted!");
        require(msg.value >= mintPrice, "Not enough ETH sent!");
        if (!isOpenMintLive) {
            require(isWlMintLive, "Whitelist minting has not started yet");
            require(isValid(_proof, keccak256(abi.encodePacked(msg.sender))), "You are not whitelisted!");
        }
        require(mintedCount[msg.sender] < maxPerWallet, "You have already minted enough!");
        require(super.totalSupply() < (premintSupply + publicSupply), "Supply minted out!");
        mintedCount[msg.sender] += 1;
        super._safeMint(msg.sender, 1);
    }
}
