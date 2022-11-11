pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INecklaces {
    function eventCounter() external returns(uint256);
}

contract NightCats is ERC721A, Ownable {
    // contracts
    address necklaceContract;
    address genesisContract;

    // states
    mapping(uint256 => bool)[] public isCatImmunePerEvent;
    string public immuneState = "immune";
    mapping(uint256 => bool) public isCatDead;

    // whitelisting hex
    bytes32 public wlHex;

    // minting
    uint256 public wlMintPrice = 0.025 ether;
    uint256 public publicMintPrice = 0.035 ether;
    uint256 public premintSupply = 333;
    uint256 public maxSupply = 3333;
    uint256 public maxPerWallet = 3;
    mapping(address => uint256) mintedCount;
    bool public isPreMintComplete = false;
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
        require(isPreMintComplete, "You haven't pre-minted your cats yet!");
        isWlMintLive = _isWlMintLive;
    }

    function setIsPublicMintLive(bool _isPublicMintLive) public onlyOwner {
        require(isPreMintComplete, "You haven't pre-minted your cats yet!");
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

    function setPremintSupply(uint256 _premintSupply) public onlyOwner {
        premintSupply = _premintSupply;
    }

    function premint() public onlyOwner {
        require (isPreMintComplete == false, "Reserve is already minted!");
        isPreMintComplete = true;
        super._safeMint(msg.sender, premintSupply);
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

    function isCatCurrentlyImmune(uint256 _catId) public view returns(bool) {
        return isCatImmunePerEvent[isCatImmunePerEvent.length - 1][_catId];
    }

    modifier onlyOperatorContracts() {
        require(
            msg.sender == genesisContract ||
            msg.sender == necklaceContract,
            "Caller was neither owner nor an operator contract"
        );
        _;
    }

    function giveCatImmunity(uint256 _catId) public onlyOperatorContracts {
        uint256 eventCount = INecklaces(necklaceContract).eventCounter();
        require(eventCount > 0, "Can't change state before an event");
        uint256 eventIndex = eventCount - 1;
        isCatImmunePerEvent[eventIndex][_catId] = true;
    }

    function killCat(uint256 _catId) public onlyOperatorContracts {
        isCatDead[_catId] = true;
    }

    function resurrectCat(uint256 _catId) public onlyOperatorContracts {
        isCatDead[_catId] = false;
    }

    function newImmunityRecord() public onlyOperatorContracts {
        isCatImmunePerEvent.push();
    }

    // TODO: TokenURI
}
