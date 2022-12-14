// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INightCats {
    function isCatDead(uint256 _catId) external returns(bool);

    function giveCatImmunity(uint256 _catId) external;

    function newImmunityRecord() external;

    function resurrectCat(uint256 _catId) external;
}

contract Necklaces is ERC721A, Ownable {
    // contracts
    address public nightCatsGenesisContract;
    address public nightCatsContract;

    // events
    uint256 public eventCounter = 0;
    uint public eventTimestamp;
    uint256 public eventDuration = 1 days;
    uint public resurrectionTimestamp;
    uint256 public resurrectionPeriod = 1 days;
    mapping(uint256 => uint256)[] public catToNecklacesClaimed;
    uint256 maxClaimsPerEvent = 2;
    uint public raffleTimestamp;
    uint public rafflePeriod = 2 days;
    uint256[] raffleEntries;

    // base uris
    string public immunityUri;
    string public resurrectionUri;


    // operators
    address[] public operators;

    function setOperators(address[] memory _operators) public onlyOwner {
        operators =_operators;
    }

    modifier onlyOperators() {
        bool allowedToCallFunc = false;
        for(uint256 i = 0; i < operators.length; i++) {
            if (msg.sender == operators[i]) {
                allowedToCallFunc = true;
            }
        }
        if (msg.sender == super.owner()) {
            allowedToCallFunc = true;
        }
        require(allowedToCallFunc, "You are not allowed to call this function!");
        _;
    }

    constructor() ERC721A("Necklaces", "NLACES") {}

    function setImmunityUri(string calldata _immunityUri) public onlyOwner {
        immunityUri = _immunityUri;
    }

    function setResurrectionUri(string calldata _resurrectionUri) public onlyOwner {
        resurrectionUri = _resurrectionUri;
    }

    function setResurrectionPeriod(uint256 _resurrectionPeriod) public onlyOwner {
        resurrectionPeriod = _resurrectionPeriod;
    }

    function setNightCatsContract(address _nightCatsContract) public onlyOwner {
        nightCatsContract = _nightCatsContract;
    }

    function setNightCatsGenesisContract(address _nightCatsGenesisContract) public onlyOwner {
        nightCatsGenesisContract = _nightCatsGenesisContract;
    }

    function isResurrectionNecklace(uint256 _necklaceId) public pure returns(bool) {
        return _necklaceId % 3 == 0;
    }

    function isImmunityNecklace(uint256 _necklaceId) public pure returns(bool) {
        return _necklaceId % 3 != 0;
    }

    function mint(uint256 _amount) private {
        super._safeMint(msg.sender, _amount);
    }

    function setEventDuration(uint256 _eventDuration) public onlyOwner {
        eventDuration = _eventDuration;
    }

    function startResurrectionPeriod() public onlyOperators {
        resurrectionTimestamp = block.timestamp;
    }

    function startEvent() public onlyOperators {
        eventCounter++;
        catToNecklacesClaimed.push();
        INightCats(nightCatsContract).newImmunityRecord();
        eventTimestamp = block.timestamp;
    }


    function isResurrectionRitualActive() public view returns(bool) {
        return (resurrectionTimestamp + resurrectionPeriod) >= block.timestamp;
    }

    function isEventActive() public view returns(bool) {
        return (eventTimestamp + eventDuration) >= block.timestamp;
    }

    function _checkGenesisCatOwnership(uint256 _catId) internal view virtual {
        require(IERC721A(nightCatsGenesisContract).ownerOf(_catId) == msg.sender, "This is not your cat!");
    }

    function _checkCatOwnership(uint256 _catId) internal view virtual {
        require(IERC721A(nightCatsContract).ownerOf(_catId) == msg.sender, "This is not your cat!");
    }

    modifier onlyWhenEventActive() {
        require(isEventActive(), "Event is not Active!");
        _;
    }

    modifier onlyWhenResurrectionRitual() {
        require(isResurrectionRitualActive(), "Resurrection ritual is not going on!");
        _;
    }

    function claimNecklaces(uint256 _catId, bool _isGenesis) public onlyWhenEventActive {
        uint256 eventIndex = eventCounter - 1;
        require(catToNecklacesClaimed[eventIndex][_catId] < maxClaimsPerEvent, "You have already claimed the max amount!");
        if (_isGenesis) {
            _checkGenesisCatOwnership(_catId);
        } else {
            _checkCatOwnership(_catId);
        }
        catToNecklacesClaimed[eventIndex][_catId] = maxClaimsPerEvent;
        mint(maxClaimsPerEvent);
    }

    function ownerMint(uint256 _amount) public onlyOwner {
        mint(_amount);
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        if (isResurrectionNecklace(_tokenId)) {
            return string(abi.encodePacked(resurrectionUri, Strings.toString(_tokenId)));
        } else {
            return string(abi.encodePacked(immunityUri, Strings.toString(_tokenId)));
        }
    }

    function setRafflePeriod(uint _rafflePeriod) public onlyOwner {
        rafflePeriod = _rafflePeriod;
    }

    function startRaffle() public onlyOperators {
        delete raffleEntries;
        raffleTimestamp = block.timestamp;
    }

    function isRaffleActive() public view returns(bool) {
        return raffleTimestamp + rafflePeriod >= block.timestamp;
    }

    function fightGodCat(uint256 _catId, uint256[] calldata _necklaceIds) public {
        require(isRaffleActive(), "Raffle not active!");
        require(IERC721A(nightCatsGenesisContract).ownerOf(_catId) == msg.sender, "This is not your cat!");
        for (uint256 i = 0; i < _necklaceIds.length; i++) {
            uint256 _necklaceId = _necklaceIds[i];
            require(super.ownerOf(_necklaceId) == msg.sender, "This necklace is not yours!");
            super._burn(_necklaceId);
            if (isResurrectionNecklace(_necklaceId)) {
                raffleEntries.push(_catId);
                raffleEntries.push(_catId);
                raffleEntries.push(_catId);
            } else {
                raffleEntries.push(_catId);
            }
        }
    }

    function getRaffleEntries() public view onlyOwner returns (uint256[] memory){
        return raffleEntries;
    }

    modifier catOwned(uint256 _catId) {
        require(IERC721A(nightCatsContract).ownerOf(_catId) == msg.sender, "This is not your cat!");
        _;
    }

    modifier necklaceOwned(uint256 _necklaceId) {
        require(super.ownerOf(_necklaceId) == msg.sender, "This is not your necklace!");
        _;
    }

    function consumeImmunityNecklace(uint256 _catId, uint256 _necklaceId) public
        catOwned(_catId) necklaceOwned(_necklaceId) onlyWhenEventActive
    {
        require(isImmunityNecklace(_necklaceId), "This is not an immunity necklace!");
        require(!INightCats(nightCatsContract).isCatDead(_catId), "This cat is dead!");
        super._burn(_necklaceId);
        INightCats(nightCatsContract).giveCatImmunity(_catId);
    }

    function consumeResurrectionNecklace(uint256 _catId, uint256 _necklaceId) public
        catOwned(_catId) necklaceOwned(_necklaceId) onlyWhenResurrectionRitual
    {
        require(isResurrectionNecklace(_necklaceId), "This is not a resurrection necklace!");
        require(INightCats(nightCatsContract).isCatDead(_catId), "This cat is not dead!");
        super._burn(_necklaceId);
        INightCats(nightCatsContract).resurrectCat(_catId);
    }
}
