const { ethers } = require("hardhat");

async function main(){
    const marketInstance = await ethers.getContractFactory("ServicesMarket");
    const market = await marketInstance.deploy();

    console.log("Market deployed to", market.address);

    const serviceInstance = await ethers.getContractFactory("ServicePurchase");
    const service = await serviceInstance.deploy(market.address);

    console.log("Service deployed to: ", service.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });