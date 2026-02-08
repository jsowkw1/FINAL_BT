const SEPOLIA_CHAIN_ID = 11155111n;
// CONTRACT ADDRESSES
const AID_PLATFORM_ADDRESS = "0xfea1fB16e14E4cD3A3C1D3A95948BBA7a45f4A61";
const AID_TOKEN_ADDRESS = "0x4E2F00dBE722d905c8CB3da8c1d9af7bc2AF22cB";

//ABI
const platformABI = [
  // functions
  "function donate(uint256 _id) external payable",
  "function createAidRequest(string,uint256,uint256) external",
  "function campaigns(uint256) view returns (string title, uint256 goal, uint256 deadline, uint256 raised, bool finalized, address creator)",

  // EVENT
  "event CampaignCreated(uint256 id, string title, uint256 goal, uint256 deadline)",
];
const tokenABI = ["function balanceOf(address) view returns (uint256)"];

// GLOBALS
let provider;
let signer;
let userAddress;

// CONNECT WALLET
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  // CHECK NETWORK
  const network = await provider.getNetwork();

  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    alert("Please switch MetaMask to Sepolia testnet");
    return;
  }

  document.getElementById("account").innerText = "Connected: " + userAddress;
}
//CHECK ETH BALANCE
async function checkEthBalance() {
  if (!provider || !userAddress) {
    alert("Connect wallet first");
    return;
  }

  const balanceWei = await provider.getBalance(userAddress);
  const balanceEth = ethers.formatEther(balanceWei);

  document.getElementById("ethBalance").innerText = balanceEth + " ETH";
}
//CHECK TOKEN BALANCE
async function checkTokenBalance() {
  if (!provider || !userAddress) return;

  const token = new ethers.Contract(AID_TOKEN_ADDRESS, tokenABI, provider);

  const balance = await token.balanceOf(userAddress);

  document.getElementById("tokenBalance").innerText =
    ethers.formatUnits(balance, 18) + " AID";
}

//CREATE CAMPAIGN
async function createCampaign() {
  if (!signer) {
    alert("Connect wallet first");
    return;
  }

  const title = document.getElementById("title").value;
  const goalEth = document.getElementById("goal").value;
  const durationDays = document.getElementById("duration").value;

  if (!title || !goalEth || !durationDays) {
    alert("Fill all fields");
    return;
  }

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    signer,
  );

  const goalWei = ethers.parseEther(goalEth);
  const durationSeconds = Number(durationDays) * 24 * 60 * 60;

  const tx = await platform.createAidRequest(title, goalWei, durationSeconds);

  document.getElementById("createStatus").innerText =
    "Transaction sent: " + tx.hash;

  const receipt = await tx.wait();

  let campaignId = null;

  for (const log of receipt.logs) {
    try {
      const parsed = platform.interface.parseLog(log);
      if (parsed.name === "CampaignCreated") {
        campaignId = parsed.args.id.toString();
        break;
      }
    } catch (e) {}
  }

  if (campaignId === null) {
    document.getElementById("createStatus").innerText =
      "Campaign created, but ID not found in events";
    return;
  }

  document.getElementById(
    "createStatus",
  ).innerText = `Campaign created! ID: ${campaignId}`;
}

//DONATE
async function donate() {
  if (!signer) {
    alert("Connect wallet first");
    return;
  }

  const campaignId = document.getElementById("donateId").value;

  if (campaignId === "") {
    alert("Enter campaign ID");
    return;
  }

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    signer,
  );

  const tx = await platform.donate(campaignId, {
    value: ethers.parseEther("0.01"),
  });

  document.getElementById("txStatus").innerText =
    "Transaction sent: " + tx.hash;

  await tx.wait();

  document.getElementById("txStatus").innerText = "Donation confirmed!";
}

//LOAD CAMPAIGN INFO (BY ID)
async function loadCampaign() {
  if (!provider) return;

  const campaignId = document.getElementById("donateId").value;
  if (campaignId === "") return;

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    provider,
  );

  const campaign = await platform.campaigns(campaignId);

  const deadline = Number(campaign.deadline);
  const finalized = campaign.finalized;
  const now = Math.floor(Date.now() / 1000);

  const date = new Date(deadline * 1000);
  document.getElementById("deadline").innerText = date.toLocaleString();

  let status = "Active";
  if (now > deadline) status = "Ended";
  if (finalized) status = "Finalized";

  document.getElementById("status").innerText = status;
}

async function showCampaign() {
  if (!provider) {
    alert("Connect wallet first");
    return;
  }

  const campaignId = document.getElementById("donateId").value;
  if (campaignId === "") {
    alert("Enter campaign ID");
    return;
  }

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    provider,
  );

  const campaign = await platform.campaigns(campaignId);

  // title
  document.getElementById("campaignTitle").innerText = campaign.title;

  // deadline
  const deadline = Number(campaign.deadline);
  const date = new Date(deadline * 1000);
  document.getElementById("deadline").innerText = date.toLocaleString();

  // status
  const now = Math.floor(Date.now() / 1000);
  let status = "Active";

  if (now > deadline) status = "Ended";
  if (campaign.finalized) status = "Finalized";

  document.getElementById("status").innerText = status;
}
