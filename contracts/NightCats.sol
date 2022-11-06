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

    function setGenesisContract(address _genesisContract) public onlyOwner {
        genesisContract = _genesisContract;
    }

    function setNecklaceContract(address _necklaceContract) public onlyOwner {
        necklaceContract = _necklaceContract;
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }

    function setWlHex(bytes32 _wlHex) public onlyOwner {
        wlHex = _wlHex;
    }

    function setIsWlMintLive(bool _isWlMintLive) public onlyOwner {
        isWlMintLive = _isWlMintLive;
    }

    function setIsPublicMintLive(bool _isPublicMintLive) public onlyOwner {
        isPublicMintLive = _isPublicMintLive;
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
        require(isWlMintLive, "WL Mint is not live!");
        require(msg.value >= (wlMintPrice * _mintAmount), "Not enough ETH sent!");
        require(mintedCount[msg.sender] < maxPerWallet, "You have already minted enough!");
        require(isValid(_proof, keccak256(abi.encodePacked(msg.sender))), "You are not whitelisted!");
        require(_mintAmount <= maxPerWallet, "You are attempting to mint more than you're allowed");
        require((super.totalSupply() + _mintAmount) <= maxSupply, "Attempting to mint above max supply!");
        mintedCount[msg.sender] += _mintAmount;
        super._safeMint(msg.sender, _mintAmount);
    }

    function publicMint(uint256 _mintAmount) public payable {
        require(isPublicMintLive, "Public Mint is not live!");
        require(msg.value >= (publicMintPrice * _mintAmount), "Not enough ETH sent!");
        require((super.totalSupply() + _mintAmount) <= maxSupply, "Attempting to mint above max supply!");
        super._safeMint(msg.sender, _mintAmount);
    }

    modifier onlyGenesisContract() {
        require(msg.sender == genesisContract, "You cannot call this function!");
        _;
    }

    function burn(uint256 _catId) external onlyGenesisContract returns (bool) {
        super._burn(_catId);
        return true;
    }
}
