const SEPOLIA_CHAIN_ID = 11155111n;

// CONTRACT ADDRESSES
const AID_PLATFORM_ADDRESS = "0xfea1fB16e14E4cD3A3C1D3A95948BBA7a45f4A61";
const AID_TOKEN_ADDRESS = "0x4E2F00dBE722d905c8CB3da8c1d9af7bc2AF22cB";

// ABI
const platformABI = [
  "function donate(uint256 _id) external payable",
  "function createAidRequest(string,uint256,uint256) external",
  "function campaigns(uint256) view returns (string title, uint256 goal, uint256 deadline, uint256 raised, bool finalized, address creator)",
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

  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    alert("Please switch MetaMask to Sepolia testnet");
    return;
  }

  document.getElementById("account").innerText = "Connected: " + userAddress;
}

// ETH BALANCE
async function checkEthBalance() {
  if (!provider || !userAddress) return;

  const balanceWei = await provider.getBalance(userAddress);
  document.getElementById("ethBalance").innerText =
    ethers.formatEther(balanceWei) + " ETH";
}

// TOKEN BALANCE
async function checkTokenBalance() {
  if (!provider || !userAddress) return;

  const token = new ethers.Contract(AID_TOKEN_ADDRESS, tokenABI, provider);
  const balance = await token.balanceOf(userAddress);

  document.getElementById("tokenBalance").innerText =
    ethers.formatUnits(balance, 18) + " AID";
}

// CREATE CAMPAIGN
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

  const tx = await platform.createAidRequest(
    title,
    ethers.parseEther(goalEth),
    Number(durationDays) * 24 * 60 * 60,
  );

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
    } catch {}
  }

  document.getElementById("createStatus").innerText =
    campaignId !== null
      ? `Campaign created! ID: ${campaignId}`
      : "Campaign created, but ID not found";
}

// SHOW CAMPAIGN
async function showCampaign() {
  if (!provider) return;

  const campaignId = document.getElementById("donateId").value;
  if (campaignId === "") return;

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    provider,
  );

  const campaign = await platform.campaigns(campaignId);

  document.getElementById("campaignTitle").innerText = campaign.title;

  const deadline = Number(campaign.deadline);
  document.getElementById("deadline").innerText = new Date(
    deadline * 1000,
  ).toLocaleString();

  let status = "Active";
  if (Math.floor(Date.now() / 1000) > deadline) status = "Ended";
  if (campaign.finalized) status = "Finalized";

  document.getElementById("status").innerText = status;

  // BALANCES
  document.getElementById("raised").innerText = ethers.formatEther(
    campaign.raised,
  );

  document.getElementById("goalValue").innerText = ethers.formatEther(
    campaign.goal,
  );
}

// DONATE
async function donate() {
  if (!signer) {
    alert("Connect wallet first");
    return;
  }

  const campaignId = document.getElementById("donateId").value;
  const amount = document.getElementById("donateAmount").value;

  if (campaignId === "" || amount === "") {
    alert("Select campaign and enter amount");
    return;
  }

  if (Number(amount) <= 0) {
    alert("Donation amount must be greater than 0");
    return;
  }

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    signer,
  );

  const tx = await platform.donate(campaignId, {
    value: ethers.parseEther(amount),
  });

  document.getElementById("txStatus").innerText =
    "Transaction sent: " + tx.hash;

  await tx.wait();

  document.getElementById("txStatus").innerText = "Donation confirmed!";

  // AUTO REFRESH CAMPAIGN DATA
  await showCampaign();
}

// CAMPAIGN LIST
async function loadCampaignList() {
  if (!provider) return;

  const platform = new ethers.Contract(
    AID_PLATFORM_ADDRESS,
    platformABI,
    provider,
  );

  const list = document.getElementById("campaignList");
  list.innerHTML = "";

  let id = 0;
  while (true) {
    try {
      const c = await platform.campaigns(id);

      const li = document.createElement("li");
      li.innerHTML = `
        <strong>ID ${id}</strong> — ${c.title}
        <button onclick="selectCampaign(${id})">Select</button>
      `;
      list.appendChild(li);
      id++;
    } catch {
      break;
    }
  }

  if (id === 0) {
    list.innerHTML = "<li>No campaigns found</li>";
  }
}

// SELECT FROM LIST
function selectCampaign(id) {
  document.getElementById("donateId").value = id;
  showCampaign();
}
