import { ethers } from "ethers";

export const platformAbi = [];
export const tokenAbi = [];

export async function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getContracts(platformAddress, tokenAddress) {
  const signer = await getSigner();
  const platform = new ethers.Contract(platformAddress, platformAbi, signer);
  const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
  return { platform, token, signer };
}

export async function sendTx(txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return receipt;
}
