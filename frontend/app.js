const AID_PLATFORM_ADDRESS = "0xd86B263FbD008c2d8c96e965e3654E63859A4904";
const AID_TOKEN_ADDRESS = "0x792CB28F452027E0b3BA60FeAF1D29D4578d4F5b";

const platformABI = [
  "function donate(uint256 _id) external payable",
  "function campaigns(uint256) view returns (string title, uint256 goal, uint256 deadline, uint256 raised, bool finalized, address creator)",
];

const tokenABI = ["function balanceOf(address) view returns (uint256)"];

let provider;
let signer;
let userAddress;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  document.getElementById("account").innerText = "Connected: " + userAddress;

  await loadCampaign();
}

async function checkTokenBalance() {
  const token = new ethers.Contract(AID_TOKEN_ADDRESS, tokenABI, provider);

  const balance = await token.balanceOf(userAddress);
  document.getElementById("tokenBalance").innerText =
    ethers.formatUnits(balance, 18) + " AID";
}

async function donate() {
  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    signer,
  );

  const tx = await platform.donate(0, {
    value: ethers.parseEther("0.01"),
  });

  document.getElementById("txStatus").innerText =
    "Transaction sent: " + tx.hash;

  await tx.wait();
  document.getElementById("txStatus").innerText = "Donation confirmed!";
}
async function loadCampaign() {
  if (!provider) return;

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    provider,
  );

  const campaign = await platform.campaigns(0);

  const deadline = Number(campaign.deadline);
  const now = Math.floor(Date.now() / 1000);

  const date = new Date(deadline * 1000);

  document.getElementById("deadline").innerText = date.toLocaleString();

  document.getElementById("status").innerText =
    now < deadline ? "Active" : "Ended";
}
