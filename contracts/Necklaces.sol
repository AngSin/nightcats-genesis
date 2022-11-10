pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol"; // import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Necklaces is ERC721A, Ownable {
    // contracts
    address public nightCatsGenesisContract;
    address public nightCatsContract;

    // events
    uint256 public eventCounter = 0;
    uint public eventTimestamp;
    uint256 public eventDuration = 3 days;
    mapping(uint256 => uint256)[] public catToNecklacesClaimed;
    uint256 maxClaimsPerEvent = 2;
    uint public raffleTimestamp;
    uint public rafflePeriod = 2 days;
    uint256[] raffleEntries;

    // base uris
    string public immunityUri;
    string public resurrectionUri;

    constructor() ERC721A("Necklaces", "NLACES") {}

    function setImmunityUri(string calldata _immunityUri) public onlyOwner {
        immunityUri = _immunityUri;
    }

    function setResurrectionUri(string calldata _resurrectionUri) public onlyOwner {
        resurrectionUri = _resurrectionUri;
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

    function startEvent() public onlyOwner {
        eventCounter++;
        catToNecklacesClaimed.push();
        eventTimestamp = block.timestamp;
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

    function claimNecklaces(uint256 _catId, bool _isGenesis) public onlyWhenEventActive {
        require(catToNecklacesClaimed[eventCounter-1][_catId] < maxClaimsPerEvent, "You have already claimed the max amount!");
        if (_isGenesis) {
            _checkGenesisCatOwnership(_catId);
        } else {
            _checkCatOwnership(_catId);
        }
        catToNecklacesClaimed[eventCounter-1][_catId] = maxClaimsPerEvent;
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

    function startRaffle() public onlyOwner {
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
}
