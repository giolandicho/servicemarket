// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Service.sol";


contract ServicesMarket is ReentrancyGuard{
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _itemsReleased;
    Counters.Counter private _itemsClosed;
    Counters.Counter private _itemsDisputed;


    enum State { Created, Locked, Release, Inactive }

    modifier condition(bool condition_) {
        require(condition_, "Insufficient Funds");
        _;
    }

    error OnlyBuyer();
    error OnlySeller();
    error InvalidState();

    struct Service {
        uint itemId;
        address contractAddress;
        address payable seller;
        address payable buyer;
        uint id;
        uint value;
        uint duration;
        State state;
    }
    mapping(uint => Service) idToService;

    modifier onlyBuyer(uint _itemId) {
        if (msg.sender != idToService[_itemId].buyer)
            revert OnlyBuyer();
        _;
    }

    modifier onlySeller(uint _itemId) {
        if (msg.sender != idToService[_itemId].seller)
            revert OnlySeller();
        _;
    }

    modifier inState(State state_, uint _itemId) {
        if (idToService[_itemId].state != state_)
            revert InvalidState();
        _;
    }

    event ServiceCreated(
        uint itemId,
        address contractAddress,
        address seller,
        address buyer,
        uint id,
        uint value,
        uint duration,
        State state
    );
    event ServicePurchased(
        uint itemId,
        address contractAddress,
        address seller,
        address buyer,
        uint id,
        uint value,
        uint duration,
        State state
    );
    event ServiceConcluded(
        uint itemId,
        address contractAddress,
        address seller,
        address buyer,
        uint id,
        uint value,
        uint duration,
        State state
    );
    event ServiceClosed(
        uint itemId,
        address contractAddress,
        address seller,
        address buyer,
        uint id,
        uint value,
        uint duration,
        State state
    );


    function createService(
        address _contractAddress,
        uint _id,
        uint _duration
    ) public payable nonReentrant {
        require(msg.value > 0);
        _itemIds.increment();
        uint value = msg.value;
        uint itemId = _itemIds.current();
        idToService[itemId] = Service(
            itemId,
            _contractAddress,
            payable(msg.sender),
            payable(address(0)),
            _id,
            value,
            _duration,
            State.Created
        );
        IERC721(_contractAddress).transferFrom(msg.sender, address(this), _id);
        emit ServiceCreated(
        idToService[itemId].itemId,
        idToService[itemId].contractAddress, 
        idToService[itemId].seller, 
        idToService[itemId].buyer, 
        idToService[itemId].id, 
        idToService[itemId].value, 
        idToService[itemId].duration,
        idToService[itemId].state
        );
    }
    function addValue(uint _itemId)
        external
        onlySeller(_itemId)
        inState(State.Created, _itemId)
        payable
    {
        require(msg.value > 0);
        idToService[_itemId].value += msg.value;
    }

    function getValue(uint _itemId) public view returns(uint){
        return idToService[_itemId].value;
    }
    function getDuration(uint _itemId) public view returns(uint){
        return idToService[_itemId].duration;
    }

    function reduceValue(uint _itemId, uint _reductionAmount)
        external
        onlySeller(_itemId)
        inState(State.Created,_itemId)
    {
        require(idToService[_itemId].value >= _reductionAmount);
        idToService[_itemId].seller.transfer(_reductionAmount);
        idToService[_itemId].value -= _reductionAmount;
    }

    function setDuration(uint _days, uint _itemId) 
            external
            onlySeller(_itemId)
            inState(State.Created, _itemId)
    {
        idToService[_itemId].duration = _days;
    }

    function abortService(uint _itemId)
        external
        onlySeller(_itemId)
        inState(State.Created, _itemId)
        nonReentrant
    {
        idToService[_itemId].state = State.Inactive;
        uint serviceValue = idToService[_itemId].value;
        idToService[_itemId].seller.transfer(serviceValue);
        _itemsClosed.increment();
        emit ServiceClosed(
            idToService[_itemId].itemId,
            idToService[_itemId].contractAddress,
            idToService[_itemId].seller,
            idToService[_itemId].buyer,
            idToService[_itemId].id,
            idToService[_itemId].value,
            idToService[_itemId].duration,
            idToService[_itemId].state
        );
    }

    function purchaseService(
        uint256 _itemId
    ) public inState(State.Created, _itemId) payable nonReentrant {
        uint value = idToService[_itemId].value;
        require(msg.value >= 2 * value);
        idToService[_itemId].state = State.Locked;
        idToService[_itemId].value += msg.value;
        idToService[_itemId].buyer = payable(msg.sender);
        _itemsSold.increment();

        emit ServicePurchased(
            _itemId, 
            idToService[_itemId].contractAddress, 
            idToService[_itemId].seller, 
            idToService[_itemId].buyer, 
            idToService[_itemId].id, 
            idToService[_itemId].value, 
            idToService[_itemId].duration, 
            idToService[_itemId].state);
    }
    
    function confirmServiceConclusion(
        uint256 _itemId
    ) external onlyBuyer(_itemId) inState(State.Locked, _itemId) nonReentrant
    {
        idToService[_itemId].state = State.Release;
        uint buyerRefund = idToService[_itemId].value / 3;
        idToService[_itemId].buyer.transfer(buyerRefund);
        idToService[_itemId].value -= buyerRefund;
        IERC721(idToService[_itemId].contractAddress).transferFrom(address(this), msg.sender, idToService[_itemId].id);
        _itemsReleased.increment();
        emit ServiceConcluded(
            _itemId, 
            idToService[_itemId].contractAddress, 
            idToService[_itemId].seller, 
            idToService[_itemId].buyer, 
            idToService[_itemId].id, 
            idToService[_itemId].value, 
            idToService[_itemId].duration, 
            idToService[_itemId].state);
    }

    function refundBuyer(
        uint _itemId
    )   external 
        onlySeller(_itemId) 
        inState(State.Locked, _itemId)
        nonReentrant
    {
        idToService[_itemId].state = State.Release;
        uint buyerRefund = idToService[_itemId].value * 2 / 3;
        idToService[_itemId].buyer.transfer(buyerRefund);
        idToService[_itemId].value -= buyerRefund;
        _itemsReleased.increment();
        emit ServiceConcluded(
            idToService[_itemId].itemId,
            idToService[_itemId].contractAddress, 
            idToService[_itemId].seller, 
            idToService[_itemId].buyer, 
            idToService[_itemId].id, 
            idToService[_itemId].value, 
            idToService[_itemId].duration, 
            idToService[_itemId].state
        );
    }

    function refundSeller(
        uint _itemId, 
        uint _withdrawAmount
    )
        external
        onlySeller(_itemId)
        inState(State.Release, _itemId)
        nonReentrant
    {
        require(_withdrawAmount <= idToService[_itemId].value);
        idToService[_itemId].state = State.Inactive;
        idToService[_itemId].seller.transfer(_withdrawAmount);
        _itemsClosed.increment();
        emit ServiceClosed(
            _itemId, 
            idToService[_itemId].contractAddress, 
            idToService[_itemId].seller, 
            idToService[_itemId].buyer, 
            idToService[_itemId].id, 
            idToService[_itemId].value, 
            idToService[_itemId].duration, 
            idToService[_itemId].state
        );
    }

    function fetchAvailableServices() 
        public view returns (Service[] memory)
    {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        Service [] memory services = new Service[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToService[i + 1].buyer == address(0)) {
            uint currentId = i + 1;
            Service storage currentService = idToService[currentId];
            services[currentIndex] = currentService;
            currentIndex += 1;
      }
    }
    return services;
    }

    function fetchMyServices()
        public view returns (Service[] memory)
    {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToService[i + 1].buyer == msg.sender) {
            itemCount += 1;
            }
        }

        Service[] memory services = new Service[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToService[i + 1].buyer == msg.sender) {
            uint currentId = i + 1;
            Service storage currentService = idToService[currentId];
            services[currentIndex] = currentService;
            currentIndex += 1;
            }
        }
        return services;    
    }

    function fetchServicesCreated()
        public view returns(Service [] memory)
    {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToService[i + 1].seller == msg.sender) {
            itemCount += 1;
      }
    }

        Service[] memory services = new Service [](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToService[i + 1].seller == msg.sender) {
            uint currentId = i + 1;
            Service storage currentService = idToService[currentId];
            services[currentIndex] = currentService;
            currentIndex += 1;
            }
        }
            return services;
        
    }
}
