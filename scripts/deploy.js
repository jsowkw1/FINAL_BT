const hre = require("hardhat");

async function main() {
  const AidToken = await hre.ethers.getContractFactory("AidToken");
  const token = await AidToken.deploy();
  await token.waitForDeployment();

  console.log("AidToken deployed to:", await token.getAddress());

  // если платформа уже задеплоена
  // await token.setPlatform(PLATFORM_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
