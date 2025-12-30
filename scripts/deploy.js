const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKA");
  const tokenB = await MockERC20.deploy("Token B", "TKB");

  const DEX = await ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(tokenA.address, tokenB.address);

  console.log("TokenA:", tokenA.address);
  console.log("TokenB:", tokenB.address);
  console.log("DEX:", dex.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
