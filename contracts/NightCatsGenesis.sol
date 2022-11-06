// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INightCats {
    function burn(uint256 _catId) external returns(bool);
}

contract NightCatsGenesis is ERC721A, Ownable {
    // contracts
    address necklaceContract;
    address nightCatsContract;

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

    // states
    uint256[] public godCatTokenIds;

    // curse
    uint256 public curseCount = 0;
    uint public curseTimestamp;
    uint public cursePeriod = 3 days;

    // uris
    string public baseStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmVM3agU7eZXyvYgUwzX8LZFtgz4FfNR31pbLAH4Ykdtkb/";
    string public cursedStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmYDxzyU5xqm5ZUMbJS8T3jUGeG6bQwdjDp4nvKQnkM2Xx/";
    string public finalStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmWPLEsUJ5vXa8VrcdByTTxFUc7RkriGKtjrpGNU7WMiAU/";
    string public godCatUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmTEVBu1BpBjNjZdx8wxXwkYAm2856Yvq58AC1mdcY9YuT/";

    // libraries
    using Strings for uint256;

    constructor() ERC721A("NightCatsGenesis", "GCATS") {}

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setNightCatsContract(address _nightCatsContract) public onlyOwner {
        nightCatsContract = _nightCatsContract;
    }

    function setBaseStateUri(string calldata _baseStateUri) public onlyOwner {
        baseStateUri = _baseStateUri;
    }

    function setCursedStateUri(string calldata _cursedStateUri) public onlyOwner {
        cursedStateUri = _cursedStateUri;
    }

    function setFinalStateUri(string calldata _finalStateUri) public onlyOwner {
        finalStateUri = _finalStateUri;
    }

    function setGodCatUri(string calldata _godCatUri) public onlyOwner {
        godCatUri = _godCatUri;
    }

    function setGodCatTokenIds(uint256[] calldata _godCatTokenIds) public onlyOwner {
        godCatTokenIds = _godCatTokenIds;
    }

    function setCursePeriod(uint _cursePeriod) public onlyOwner {
        cursePeriod = _cursePeriod;
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
        require(isPreMintComplete, "You haven't pre-minted your cats yet!");
        isWlMintLive = _isWlMintLive;

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

    function mint(bytes32[] calldata _proof) public payable {
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

    function isGodCat(uint256 _tokenId) public view returns(bool) {
        for (uint256 i = 0; i < godCatTokenIds.length; i++) {
            if (godCatTokenIds[i] == _tokenId) {
                return true;
            }
        }
        return false;
    }

    function inflictCurse() public onlyOwner {
        curseCount++;
        curseTimestamp = block.timestamp;
        // TODO: catsKilledDuringThisCurse = 0;
    }

    function isCurseActive() public view returns(bool){
        return (curseTimestamp + cursePeriod) >= block.timestamp;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        if (isGodCat(_tokenId)) {
            return string(abi.encodePacked(godCatUri, Strings.toString(_tokenId)));
        }
        if (curseCount > 2 || (curseCount == 2 && !isCurseActive())) {
            return string(abi.encodePacked(finalStateUri, Strings.toString(_tokenId)));
        }
        if (isCurseActive() && curseCount < 3) {
            return string(abi.encodePacked(cursedStateUri, Strings.toString(_tokenId)));
        }
        return string(abi.encodePacked(baseStateUri, Strings.toString(_tokenId)));
    }

    function claimGenesis(uint256[] calldata _catIds) public {
        require(_catIds.length == 10, "You did not send 10 cats");
        require(super.totalSupply() < (premintSupply + publicSupply + reserveSupply), "Max limit reached!");

        for (uint256 i = 0; i < _catIds.length; i++) {
            uint256 _catId = _catIds[i];
            require(
                IERC721A(nightCatsContract).ownerOf(_catId) == msg.sender,
                string(abi.encodePacked("You are not the owner of cat #", Strings.toString(_catId)))
            );
            bool success = INightCats(nightCatsContract).burn(_catId);
            // no need to check for approvals as _burn does that
            require(success, string(abi.encodePacked("Failed to burn cat #", Strings.toString(_catId))));
        }
        super._safeMint(msg.sender, 1);
    }
}
