// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    address public manager;
    address[] private managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;
        _addManager(_manager);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        require(_isAllConfirmed(), "Not all confirmed yet");
        _;
        _clearConfirmations();
    }

    function confirm() external onlyManager {
        confirmed[msg.sender] = true;
    }

    function addManager(address _manager) external onlyOwner {
        _addManager(_manager);
    }

    function getManagers() external view returns (address[] memory) {
        return managers;
    }

    function _addManager(address _manager) private {
        require(_manager != address(0), "Invalid manager");
        require(!isManager[_manager], "Duplicated manager");

        isManager[_manager] = true;
        managers.push(_manager);
    }

    function _isAllConfirmed() private view returns (bool) {
        require(managers.length >= 3, "At least 3 managers required");

        for (uint256 i = 0; i < managers.length; i++) {
            if (!confirmed[managers[i]]) {
                return false;
            }
        }

        return true;
    }

    function _clearConfirmations() private {
        for (uint256 i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }
    }
}
