const { assert, expect } = require("chai");
const { deployments, getNamedAccounts, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft MarketPlace Test", () => {
          let nftMarketPlace;
          let basicNft;
          let deployer;
          let user1;
          const PRICE = ethers.utils.parseEther("0.5");
          const TOKEN_ID = 0;
          beforeEach(async () => {
              const accounts = await getNamedAccounts();
              deployer = accounts.deployer;
              user1 = accounts.user1;

              await deployments.fixture([
                  "nftmarketplace",
                  "basicnft",
                  "basicnfttwo",
              ]);
              nftMarketPlace = await ethers.getContract(
                  "NftMarketPlace",
                  deployer
              );
              basicNft = await ethers.getContract("BasicNft", deployer);
              await basicNft.mintNft();
          });

          it("was deployed", () => {
              assert(nftMarketPlace.address);
          });

          describe("listItem", () => {
              it("should update listings and emit ItemListed when list the nft", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);

                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  )
                      .to.emit(nftMarketPlace, "ItemListed")
                      .withArgs(deployer, basicNft.address, TOKEN_ID, PRICE);

                  const listing = await nftMarketPlace.getListings(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price.toString(), PRICE.toString());
                  assert.equal(listing.seller, deployer);
              });

              it("should revert with AlreadyListed when trying to list an already listed nft", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketPlace__AlreadyListed");
              });

              it("should revert with NotOwner when a different account is trying to list an nft", async () => {
                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await expect(
                      nftMarketPlaceUser1.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketPlace__NotOwner");
              });

              it("should revert with PriceMustBeAboveZero when trying to list an nft with price zero", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketPlace__PriceMustBeAboveZero");
              });

              it("should revert with NotApprovedForMarketplace when trying to list an unapproved nft", async () => {
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      "NftMarketPlace__NotApprovedForMarketplace"
                  );
              });
          });

          describe("buyItem", () => {
              it("should update the proceeds and delete the nft from listing when an user buys nft", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );

                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );

                  const initialOwnerProceeds = await nftMarketPlace.getProceeds(
                      deployer
                  );
                  await nftMarketPlaceUser1.buyItem(
                      basicNft.address,
                      TOKEN_ID,
                      {
                          value: PRICE,
                      }
                  );
                  const ownerProceeds = await nftMarketPlace.getProceeds(
                      deployer
                  );

                  const listing = await nftMarketPlace.getListings(
                      basicNft.address,
                      0
                  );
                  assert.equal(listing.price.toString(), 0);
                  assert.equal(listing.seller.toString(), 0);
                  assert.equal(
                      ownerProceeds.toString(),
                      initialOwnerProceeds.add(PRICE).toString()
                  );
              });

              it("should emit ItemBought when buy an nft", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );

                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );

                  await expect(
                      nftMarketPlaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  )
                      .to.emit(nftMarketPlace, "ItemBought")
                      .withArgs(user1, basicNft.address, TOKEN_ID, PRICE);
              });

              it("should revert with NotListed when trying to buy an unlisted nft", async () => {
                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );

                  await expect(
                      nftMarketPlaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.revertedWith("NftMarketPlace__NotListed");
              });

              it("should revert with PriceNotMet when trying to buy an nft with less then minimum", async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );

                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );

                  await expect(
                      nftMarketPlaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: 0,
                      })
                  ).to.revertedWith(
                      `NftMarketPlace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
                  );
              });
          });

          describe("cancelListing", () => {
              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
              });

              it("should delete the listing when cancel the listing", async () => {
                  await nftMarketPlace.cancelListing(
                      basicNft.address,
                      TOKEN_ID
                  );
                  const listing = await nftMarketPlace.getListings(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price, 0);
                  assert.equal(listing.seller, 0);
              });

              it("should emit ItemCanceled when cancel the listing", async () => {
                  await expect(
                      nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
                  )
                      .to.emit(nftMarketPlace, "ItemCanceled")
                      .withArgs(deployer, basicNft.address, TOKEN_ID);
              });

              it("should revert with NotOwner when somebody else is trying to cancel the listing", async () => {
                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );
                  await expect(
                      nftMarketPlaceUser1.cancelListing(
                          basicNft.address,
                          TOKEN_ID
                      )
                  ).to.revertedWith("NftMarketPlace__NotOwner");
              });

              it("should revert with NotListed when trying to cancel a not listed nft", async () => {
                  await nftMarketPlace.cancelListing(
                      basicNft.address,
                      TOKEN_ID
                  );

                  // nft is not listed anymore from this stage
                  await expect(
                      nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.revertedWith("NftMarketPlace__NotListed");
              });
          });

          describe("updateListing", () => {
              let newPrice;
              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  newPrice = ethers.utils.parseEther("0.6");
              });

              it("should update the listing with the new price", async () => {
                  await nftMarketPlace.updateListing(
                      basicNft.address,
                      TOKEN_ID,
                      newPrice
                  );
                  const listing = await nftMarketPlace.getListings(
                      basicNft.address,
                      TOKEN_ID
                  );

                  assert.equal(listing.price.toString(), newPrice.toString());
              });

              it("should emit ItemListed when update the listing with the new price", async () => {
                  await expect(
                      nftMarketPlace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  )
                      .to.emit(nftMarketPlace, "ItemListed")
                      .withArgs(deployer, basicNft.address, TOKEN_ID, newPrice);
              });

              it("should revert with NotOwner when somebody else is trying to update the listing", async () => {
                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );
                  await expect(
                      nftMarketPlaceUser1.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  ).to.revertedWith("NftMarketPlace__NotOwner");
              });

              it("should revert with NotListed when trying to update a not listed nft", async () => {
                  await nftMarketPlace.cancelListing(
                      basicNft.address,
                      TOKEN_ID
                  );

                  // nft is not listed anymore from this stage
                  await expect(
                      nftMarketPlace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  ).to.revertedWith("NftMarketPlace__NotListed");
              });

              it("should revert with PriceMustBeAboveZero when trying to update a not listed nft", async () => {
                  await expect(
                      nftMarketPlace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          0
                      )
                  ).to.revertedWith("NftMarketPlace__PriceMustBeAboveZero");
              });
          });

          describe("withdrawProceeds", () => {
              it("should withdraw the proceeds", async () => {
                  const nftMarketPlaceUser1 = await ethers.getContract(
                      "NftMarketPlace",
                      user1
                  );
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID);
                  await nftMarketPlace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  await nftMarketPlaceUser1.buyItem(
                      basicNft.address,
                      TOKEN_ID,
                      {
                          value: PRICE,
                      }
                  );

                  const initialBalance =
                      await nftMarketPlace.provider.getBalance(deployer);

                  const txResponse = await nftMarketPlace.withdrawProceeds();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = txReceipt;

                  const gasPrice = gasUsed.mul(effectiveGasPrice);

                  const balance = await nftMarketPlace.provider.getBalance(
                      deployer
                  );

                  const proceeds = await nftMarketPlace.getProceeds(deployer);

                  assert.equal(
                      balance.add(gasPrice).toString(),
                      initialBalance.add(PRICE).toString()
                  );

                  assert.equal(proceeds, 0);
              });

              it("should revert with NoProceeds when trying to withdraw the zero proceeds", async () => {
                  await expect(
                      nftMarketPlace.withdrawProceeds()
                  ).to.revertedWith("NftMarketPlace__NoProceeds");
              });
          });
      });
