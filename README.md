# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
## Smart Contract Logic
AidPlatform.sol

The crowdfunding platform contract provides the following functionality:
Create campaigns with title, funding goal and duration, Accept donations in test ETH,
Track individual user contributions,
Finalize campaigns after the deadline,
Determine campaign success based on raised amount,
Allow campaign creator to withdraw funds if successful,
Allow contributors to refund their donation if campaign failed,
Protect sensitive functions from reentrancy attacks.

## Frontend and MetaMask Integration

The frontend interacts with the blockchain using ethers.js and MetaMask.

Features:

- Request user permission to access wallet accounts
- Display connected wallet address
- Display ETH balance and reward token balance
- Create campaigns and contribute to campaigns
- Finalize campaigns and execute withdraw or refund actions
- All transactions are confirmed via MetaMask

## ERC-20 Reward Token

The AidToken is a custom ERC-20 token used to reward users for donations.
Tokens are minted automatically during contribution through the crowdfunding smart contract.
Minting is restricted to the platform contract to ensure security.
The token has no real monetary value and is used for educational purposes only.

## Network

The application is deployed on the Sepolia Ethereum test network using free test ETH obtained from a faucet.
https://cloud.google.com/application/web3/faucet/ethereum/sepolia

