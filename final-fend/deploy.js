import hardhat from "hardhat";

async function main() {
  const { ethers } = hardhat;
  const Paddy = await ethers.getContractFactory("PaddyProcurement");
  const paddy = await Paddy.deploy();

  await paddy.deployed();

  console.log(`PaddyProcurement deployed to ${paddy.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
networks:{
    hardhat:{
      chainId:5000,
    },
  }
