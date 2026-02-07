// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AidToken is ERC20, Ownable {
    address public platform;

    constructor() ERC20("Aid Token", "AID") Ownable(msg.sender) {}

    // Set crowdfunding platform contract
    function setPlatform(address _platform) external onlyOwner {
        platform = _platform;
    }

    // Mint tokens ONLY by crowdfunding platform
    function mint(address to, uint256 amount) external {
        require(msg.sender == platform, "Only platform can mint");
        _mint(to, amount);
    }
}