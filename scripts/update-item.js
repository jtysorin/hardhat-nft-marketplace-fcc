const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const PRICE = ethers.utils.parseEther("0.7");
const TOKEN_ID = 0;

async function update() {
    const nftMarketPlace = await ethers.getContract("NftMarketPlace");
    const basicNft = await ethers.getContract("BasicNft");
    console.log("Updating listing...");
    const txUpdating = await nftMarketPlace.updateListing(
        basicNft.address,
        TOKEN_ID,
        PRICE
    );
    await txUpdating.wait(1);
    console.log("List updated!");

    if (network.config.chainId == "31337") {
        // Moralis has a hard time if you move more than 1 an once!
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

update()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
