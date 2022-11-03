const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic Nft test", () => {
          let basicNft, deployer, user1;

          beforeEach(async () => {
              const accounts = await getNamedAccounts();
              deployer = accounts.deployer;
              user1 = accounts.user1;

              await deployments.fixture(["all"]);
              basicNft = await ethers.getContract("BasicNft", deployer);
          });

          it("was deployed", () => {
              assert(basicNft.address);
          });

          describe("constructor", () => {
              it("initializes the token with the correct name and symbol, and set counter to 0", async () => {
                  expect(await basicNft.name()).to.equal("Doggie");
                  expect(await basicNft.symbol()).to.equal("DOG");
                  expect(await basicNft.getTokenCounter()).to.equal(0);
              });
          });

          describe("minting", () => {
              it("user can mint one nft", async () => {
                  //   const basicNftUser1 = await ethers.getContract("BasicNft", user1);
                  const signer1 = (await ethers.getSigners())[1];
                  const basicNftUser1 = await basicNft.connect(signer1);
                  await basicNftUser1.mintNft();
                  const tokenURI = await basicNft.tokenURI(0);

                  expect(await basicNft.getTokenCounter()).to.equal(1);
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
                  expect(await basicNft.TOKEN_URI()).to.equal(tokenURI);
              });
          });

          describe("transfers", () => {
              it("should be able to transfer nft successfully to an address", async () => {
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );
                  const initialBalanceOfUser1 = parseInt(
                      (await basicNft.balanceOf(user1)).toString()
                  );
                  await basicNft.transferFrom(deployer, user1, 0);
                  expect(await basicNft.balanceOf(deployer)).to.equal(
                      initialBalanceOfDeployer - 1
                  );
                  expect(await basicNft.balanceOf(user1)).to.equal(
                      initialBalanceOfUser1 + 1
                  );
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
              });

              it("should be able to safe transfer nft successfully to an address", async () => {
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );
                  const initialBalanceOfUser1 = parseInt(
                      (await basicNft.balanceOf(user1)).toString()
                  );

                  // this aproach is used for overloaded functions in contracts
                  await basicNft["safeTransferFrom(address,address,uint256)"](
                      deployer,
                      user1,
                      0
                  );
                  expect(await basicNft.balanceOf(deployer)).to.equal(
                      initialBalanceOfDeployer - 1
                  );
                  expect(await basicNft.balanceOf(user1)).to.equal(
                      initialBalanceOfUser1 + 1
                  );
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
              });

              it("should emit transfer event when a transfer occurs", async () => {
                  // emit Transfer(from, to, tokenId);
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );

                  await expect(basicNft.transferFrom(deployer, user1, 0))
                      .to.emit(basicNft, "Transfer")
                      .withArgs(deployer, user1, 0);
              });

              it("should emit transfer event when a safe transfer occurs", async () => {
                  // emit Transfer(from, to, tokenId);
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );

                  await expect(
                      basicNft["safeTransferFrom(address,address,uint256)"](
                          deployer,
                          user1,
                          0
                      )
                  )
                      .to.emit(basicNft, "Transfer")
                      .withArgs(deployer, user1, 0);
              });
          });

          describe("allowance", () => {
              let basicNftUser1;

              beforeEach(async () => {
                  basicNftUser1 = await ethers.getContract("BasicNft", user1);
              });

              it("should approve an nft to be transfered to an address", async () => {
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );

                  await basicNft.approve(user1, 0);
                  expect(await basicNft.getApproved(0)).to.equal(user1);
              });

              it("should emit an approval event when an approval occurs", async () => {
                  // emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );

                  await expect(basicNft.approve(user1, 0))
                      .to.emit(basicNft, "Approval")
                      .withArgs(deployer, user1, 0);
              });

              it("should be able to transfer nft after approval", async () => {
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );
                  const initialBalanceOfUser1 = parseInt(
                      (await basicNft.balanceOf(user1)).toString()
                  );

                  await basicNft.approve(user1, 0);
                  expect(await basicNft.getApproved(0)).to.equal(user1);

                  await basicNftUser1.transferFrom(deployer, user1, 0);
                  expect(await basicNft.balanceOf(deployer)).to.equal(
                      initialBalanceOfDeployer - 1
                  );
                  expect(await basicNft.balanceOf(user1)).to.equal(
                      initialBalanceOfUser1 + 1
                  );
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
              });

              it("should not allow unnaproved user to transfer nft", async () => {
                  await basicNft.mintNft();
                  const initialBalanceOfDeployer = parseInt(
                      (await basicNft.balanceOf(deployer)).toString()
                  );

                  await expect(
                      basicNftUser1.transferFrom(deployer, user1, 0)
                  ).to.be.revertedWith(
                      "ERC721: caller is not token owner nor approved"
                  );
              });

              it("should set approval for all for another address", async () => {
                  await basicNft.setApprovalForAll(user1, true);
                  expect(await basicNft.isApprovedForAll(deployer, user1)).to.be
                      .true;
              });

              it("should emit ApprovalForAll event when set ApprovalForAll for another address", async () => {
                  //   emit ApprovalForAll(owner, operator, approved);
                  await expect(basicNft.setApprovalForAll(user1, true))
                      .to.emit(basicNft, "ApprovalForAll")
                      .withArgs(deployer, user1, true);
              });

              it("should be able to transfer all nfts for other address if ApprovalForAll is set to true", async () => {
                  await basicNft.mintNft(); // mint first nft
                  await basicNft.mintNft(); // mint second nft
                  await basicNft.setApprovalForAll(user1, true);

                  await basicNftUser1.transferFrom(deployer, user1, 0);
                  await basicNftUser1.transferFrom(deployer, user1, 1);

                  expect(await basicNft.balanceOf(deployer)).to.equal(0);
                  expect(await basicNft.balanceOf(user1)).to.equal(2);
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
                  expect(await basicNft.ownerOf(1)).to.equal(user1);
              });

              it("should not be able to transfer nfts for other address if ApprovalForAll is set to false", async () => {
                  await basicNft.mintNft(); // mint first nft
                  await basicNft.mintNft(); // mint second nft
                  await basicNft.setApprovalForAll(user1, true);

                  await basicNftUser1.transferFrom(deployer, user1, 0);
                  await basicNft.setApprovalForAll(user1, false);

                  expect(await basicNft.isApprovedForAll(deployer, user1)).to.be
                      .false;
                  await expect(
                      basicNftUser1.transferFrom(deployer, user1, 1)
                  ).to.be.revertedWith(
                      "ERC721: caller is not token owner nor approved"
                  );

                  expect(await basicNft.balanceOf(deployer)).to.equal(1);
                  expect(await basicNft.balanceOf(user1)).to.equal(1);
                  expect(await basicNft.ownerOf(0)).to.equal(user1);
                  expect(await basicNft.ownerOf(1)).to.equal(deployer);
              });
          });
      });
