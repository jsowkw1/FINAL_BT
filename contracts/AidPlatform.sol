// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAidToken {
    function mint(address to, uint256 amount) external;
}

contract AidPlatform {
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrancy");
        locked = true;
        _;
        locked = false;
    }

    struct Campaign {
        address creator;
        string title;
        uint256 goalWei;
        uint256 deadline;
        uint256 raisedWei;
        bool finalized;
        bool successful;
        bool withdrawn;
    }

    IAidToken public immutable rewardToken;
    uint256 public constant TOKEN_RATE = 100;

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goalWei, uint256 deadline);
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amountWei, uint256 rewardMinted);
    event Finalized(uint256 indexed id, bool successful);
    event Withdrawn(uint256 indexed id, address indexed creator, uint256 amountWei);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amountWei);

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "token address is zero");
        rewardToken = IAidToken(tokenAddress);
    }

    function createCampaign(string calldata title, uint256 goalWei, uint256 durationSeconds) external returns (uint256 id) {
        require(bytes(title).length > 0, "title empty");
        require(goalWei > 0, "goal must be > 0");
        require(durationSeconds > 0, "duration must be > 0");

        id = ++campaignCount;
        uint256 deadline = block.timestamp + durationSeconds;

        campaigns[id] = Campaign({
            creator: msg.sender,
            title: title,
            goalWei: goalWei,
            deadline: deadline,
            raisedWei: 0,
            finalized: false,
            successful: false,
            withdrawn: false
        });

        emit CampaignCreated(id, msg.sender, title, goalWei, deadline);
    }

    function contribute(uint256 id) external payable nonReentrant {
        Campaign storage c = campaigns[id];
        require(c.creator != address(0), "campaign not found");
        require(block.timestamp < c.deadline, "campaign ended");
        require(msg.value > 0, "zero amount");

        c.raisedWei += msg.value;
        contributions[id][msg.sender] += msg.value;

        uint256 rewardAmount = msg.value * TOKEN_RATE;
        rewardToken.mint(msg.sender, rewardAmount);

        emit Contributed(id, msg.sender, msg.value, rewardAmount);
    }

    function finalize(uint256 id) external {
        Campaign storage c = campaigns[id];
        require(c.creator != address(0), "campaign not found");
        require(!c.finalized, "already finalized");
        require(block.timestamp >= c.deadline, "campaign not ended");

        c.finalized = true;
        c.successful = (c.raisedWei >= c.goalWei);

        emit Finalized(id, c.successful);
    }

    function withdraw(uint256 id) external nonReentrant {
        Campaign storage c = campaigns[id];
        require(c.creator != address(0), "campaign not found");
        require(msg.sender == c.creator, "not creator");
        require(c.finalized, "not finalized");
        require(c.successful, "not successful");
        require(!c.withdrawn, "already withdrawn");

        c.withdrawn = true;
        uint256 amount = c.raisedWei;

        (bool ok, ) = payable(c.creator).call{value: amount}("");
        require(ok, "withdraw failed");

        emit Withdrawn(id, c.creator, amount);
    }

    function refund(uint256 id) external nonReentrant {
        Campaign storage c = campaigns[id];
        require(c.creator != address(0), "campaign not found");
        require(c.finalized, "not finalized");
        require(!c.successful, "campaign successful");

        uint256 amount = contributions[id][msg.sender];
        require(amount > 0, "nothing to refund");

        contributions[id][msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "refund failed");

        emit Refunded(id, msg.sender, amount);
    }

    function contributionOf(uint256 id, address user) external view returns (uint256) {
        return contributions[id][user];
    }
}