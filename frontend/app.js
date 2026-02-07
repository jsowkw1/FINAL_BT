import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.1/+esm";

const TOKEN_ADDRESS = "0xYOUR_TOKEN_ADDRESS";
const TOKEN_ABI = ["function balanceOf(address owner) view returns (uint256)"];

let provider;
let signer;
let token;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not installed");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

  const address = await signer.getAddress();
  document.getElementById("wallet").innerText = address;

  updateTokenBalance();
}

async function updateTokenBalance() {
  const address = await signer.getAddress();
  const balance = await token.balanceOf(address);
  document.getElementById("tokenBalance").innerText = ethers.formatUnits(
    balance,
    18,
  );
}

document.getElementById("connectBtn").onclick = connectWallet;
