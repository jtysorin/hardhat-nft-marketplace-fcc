const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRESSES_FILE =
    "../nextjs-nft-marketplace-fcc/constants/networkMapping.json";
    const FRONT_END_ABI_LOCATION =
    "../nextjs-nft-marketplace-fcc/constants/";

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...");
        await updateContractAddresses();
        await updateAbi();
    }
};

async function updateContractAddresses() {
    const nftMarketPlace = await ethers.getContract("NftMarketPlace");
    const chainId = network.config.chainId.toString();
    const contractAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
    );
    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["NftMarketPlace"].includes(
                nftMarketPlace.address
            )
        ) {
            contractAddresses[chainId]["NftMarketPlace"].push(
                nftMarketPlace.address
            );
        }
    } else {
        contractAddresses[chainId] = {
            NftMarketPlace: [nftMarketPlace.address],
        };
    }
    fs.writeFileSync(
        FRONT_END_ADDRESSES_FILE,
        JSON.stringify(contractAddresses)
    );
}

async function updateAbi(){
    const nftMarketPlace = await ethers.getContract("NftMarketPlace");
    fs.writeFileSync(
        `${FRONT_END_ABI_LOCATION}NFTMarketPlace.json`,
        nftMarketPlace.interface.format(ethers.utils.FormatTypes.json)
    );

    const basicNft = await ethers.getContract("BasicNft");
    fs.writeFileSync(
        `${FRONT_END_ABI_LOCATION}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    );
}

module.exports.tags = ["all", "frontend"];
