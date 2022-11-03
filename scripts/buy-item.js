const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 0;

async function buy() {
    const user1 = (await ethers.getSigners())[1];
    const nftMarketPlace = await ethers.getContract("NftMarketPlace");
    const nftMarketPlaceUser1 = await nftMarketPlace.connect(user1);
    const basicNft = await ethers.getContract("BasicNft");

    const nftListing = await nftMarketPlace.getListings(basicNft.address, TOKEN_ID);
    const price = nftListing.price;

    const tx = await nftMarketPlaceUser1.buyItem(basicNft.address, TOKEN_ID, {value: price});
    await tx.wait(1);
    console.log("NFT Bought!");

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000));
    }
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
