// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ManageAccess {
    address[] private managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    constructor(address[] memory _managers) {
        require(_managers.length >= 3, "At least 3 managers required");

        for (uint256 i = 0; i < _managers.length; i++) {
            address manager = _managers[i];
            require(manager != address(0), "Invalid manager");
            require(!isManager[manager], "Duplicated manager");

            isManager[manager] = true;
            managers.push(manager);
        }
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

    function getManagers() external view returns (address[] memory) {
        return managers;
    }

    function _isAllConfirmed() private view returns (bool) {
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
