// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAidToken {
    function mint(address to, uint256 amount) external;
}

contract AidPlatform {
    struct Campaign {
        string title;
        uint256 goal;
        uint256 deadline;
        uint256 raised;
        bool finalized;
        address creator;
    }

    Campaign[] public campaigns;

    // campaignId => donor => amount
    mapping(uint256 => mapping(address => uint256)) public contributions;

    IAidToken public aidToken;

    event CampaignCreated(uint256 id, string title, uint256 goal, uint256 deadline);
    event DonationMade(uint256 id, address donor, uint256 amount);
    event CampaignFinalized(uint256 id, uint256 totalRaised);

    constructor(address _aidToken) {
        aidToken = IAidToken(_aidToken);
    }

    // 1️⃣ Create campaign
    function createAidRequest(
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external {
        require(_goal > 0, "Goal must be > 0");
        require(_duration > 0, "Duration must be > 0");

        campaigns.push(
            Campaign({
                title: _title,
                goal: _goal,
                deadline: block.timestamp + _duration,
                raised: 0,
                finalized: false,
                creator: msg.sender
            })
        );

        emit CampaignCreated(
            campaigns.length - 1,
            _title,
            _goal,
            block.timestamp + _duration
        );
    }

    // 2️⃣ Donate to campaign
    function donate(uint256 _id) external payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(!campaign.finalized, "Already finalized");
        require(msg.value > 0, "Donation must be > 0");

        campaign.raised += msg.value;
        contributions[_id][msg.sender] += msg.value;

        // mint reward token (1 AID per 0.001 ETH for example)
        uint256 reward = msg.value / 1e15;
        aidToken.mint(msg.sender, reward);

        emit DonationMade(_id, msg.sender, msg.value);
    }

    // 3️⃣ Finalize campaign
    function finalizeRequest(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(!campaign.finalized, "Already finalized");

        campaign.finalized = true;

        emit CampaignFinalized(_id, campaign.raised);
    }

    // Helper
    function getCampaignsCount() external view returns (uint256) {
        return campaigns.length;
    }
}