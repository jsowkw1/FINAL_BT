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

## ERC-20 Reward Token

The AidToken is a custom ERC-20 token used to reward users for donations.
Tokens are minted automatically during contribution through the crowdfunding smart contract.
Minting is restricted to the platform contract to ensure security.
The token has no real monetary value and is used for educational purposes only.

### Network

The application is deployed on the Sepolia Ethereum test network using free test ETH obtained from a faucet.
