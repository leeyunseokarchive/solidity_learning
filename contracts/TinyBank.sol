// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManageAccess.sol";

interface IMyToken {
    function transferFrom(address from, address to, uint256 amount) external;

    function transfer(uint256 amount, address to) external;
}

contract TinyBank is ManageAccess {
    IMyToken public token;
    uint256 public rewardPerBlock;

    mapping(address => uint256) public staked;
    mapping(address => uint256) public stakedAtBlock;

    constructor(address _token, address[] memory _managers) ManageAccess(_managers) {
        token = IMyToken(_token);
    }

    function stake(uint256 _amount) external {
        token.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        stakedAtBlock[msg.sender] = block.number;
    }

    function withdraw(uint256 _amount) external {
        require(staked[msg.sender] >= _amount, "Insufficient staked amount");

        uint256 reward = (block.number - stakedAtBlock[msg.sender]) *
            rewardPerBlock;
        staked[msg.sender] -= _amount;
        stakedAtBlock[msg.sender] = block.number;

        token.transfer(_amount + reward, msg.sender);
    }

    function setRewardPerBlock(uint256 _amount) external onlyAllConfirmed {
        rewardPerBlock = _amount;
    }
}
