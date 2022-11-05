pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NightCats is ERC721A, Ownable {
    // contracts
    address necklaceContract;
    address genesisContract;

    // states

    // whitelisting hex
    bytes32 public wlHex;

    // minting
    uint256 public wlMintPrice = 0.025 ether;
    uint256 public publicMintPrice = 0.035 ether;
    uint256 public maxSupply = 3333;
    uint256 public maxPerWallet = 3;
    mapping(address => uint256) mintedCount;
    bool public isWlMintLive = false;
    bool public isPublicMintLive = false;

    // libraries
    using Strings for uint256;

    function setWlHex(bytes32 _wlHex) public onlyOwner {
        wlHex = _wlHex;
    }

    function setIsWlMintLive(bool _isWlMintLive) public onlyOwner {
        isWlMintLive = _isWlMintLive;

    }

    function setWlMintPrice(uint256 _wlMintPrice) public onlyOwner {
        wlMintPrice = _wlMintPrice;
    }

    function setPublicMintPrice(uint256 _publicMintPrice) public onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    function setMaxPerWallet(uint256 _maxPerWallet) public onlyOwner {
        maxPerWallet = _maxPerWallet;
    }

    constructor() ERC721A("NightCats", "NCATS") {}

    function isValid(bytes32[] memory _proof, bytes32 _leaf) internal view returns(bool) {
        return MerkleProof.verify(_proof, wlHex, _leaf);
    }

    function wlMint(bytes32[] calldata _proof, uint256 _mintAmount) public payable {
        // TODO: Add test
        require(isWlMintLive, "WL Mint is not live!");
        require(msg.value >= (wlMintPrice * _mintAmount), "Not enough ETH sent!");
        require(mintedCount[msg.sender] < maxPerWallet, "You have already minted enough!");
        require(isValid(_proof, keccak256(abi.encodePacked(msg.sender))), "You are not whitelisted!");
        require(_mintAmount <= maxPerWallet, "You are attempting to mint more than you're allowed");
        require((super.totalSupply() + _mintAmount) < maxSupply, "Supply minted out!");
        mintedCount[msg.sender] += _mintAmount;
        super._safeMint(msg.sender, _mintAmount);
    }

    function claimGenesis(uint256[] calldata _catIds) public {
        // TODO:
        require(_catIds.length == 10, "You did not send 10 cats");
//        require(super._numberBurned() < 330, "")
        for (uint256 i = 0; i < _catIds.length; i++) {
            uint256 _catId = _catIds[i];
            require(
                super.ownerOf(_catId) == msg.sender,
                string(abi.encodePacked("You are not the owner of cat #", Strings.toString(_catId)))
            );
            super._burn(_catId);
        }
    }
}
