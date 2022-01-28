const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ServicesMarket", ()=>{
    let contractInstance;
    let market;
    let item;
    let service;
    let buyer;
    let seller;

    beforeEach(async()=>{
        [buyer, seller] = await ethers.getSigners()
        //deploy market contract
        contractInstance = await ethers.getContractFactory("ServicesMarket");
        market = await contractInstance.deploy();
        await market.deployed();

    });

    describe("createService", () => {
        it("Should create new service", async() => {
            expect(await market.connect(seller).createService(30, {value: 1000})).to.emit(market, "ServiceCreated");
        });
    });

    describe("abortService", ()=>{
        it("Should allow the seller to abort after creation", async()=>{
            await market.connect(seller).createService(30, {value: 1000});
            expect(await market.connect(seller).abortService(1)).to.emit(market, "ServiceClosed");
        })
        it("Should revert if anyone but the seller tries to abort", async()=>{
            await market.connect(seller).createService(30, {value: 1000});
            await expect(market.abortService(1)).to.be.reverted;
        })
    })

    describe("reduceValue", ()=>{
        it("Should allow the seller to reduce value from service", async()=>{
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(seller).reduceValue(1, 500);
            expect(await market.getValue(1)).to.equal(500);
        })
        it("Should revert if anyone but the seller tries to reduce value", async()=>{
            await market.connect(seller).createService(30, {value: 1000});
            await expect(market.reduceValue(1,500)).to.be.reverted;
        })
    })

    describe("purchaseService", () => {
        it("Should allow the purchase of a service", async () => {
            await market.connect(seller).createService(30, {value: 1000});
            expect(await market.connect(buyer).purchaseService(1, {value: 2000})).to.emit(market, "ServicePurchased");
        })
    })

    describe("confirmPurchaseConclusion", ()=>{
        it("Should allow the buyer confirm service conclusion", async() => {
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});
            
            const tokenInstance = await ethers.getContractFactory("ServicePurchase");
            const token = await tokenInstance.deploy(market.address);
            await token.connect(buyer).createToken("0");
            expect(await market.connect(buyer).confirmServiceConclusion(1, 1, token.address)).
            to.emit(market, "ServiceConcluded");
        })
        it("Should revert if anyone but the buyer tries to confirm service conclusion", async() =>{
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});
            await expect(market.connect(seller).confirmServiceConclusion(1)).to.be.reverted
        })
    })
    describe("refundBuyer", ()=> {
        it("Should allow the seller to refund buyer", async() =>{
            await market.connect(seller).createService( 30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});
            expect(await market.connect(seller).refundBuyer(1)).to.emit(market, "ServiceConcluded");
        })
        it("Should revert if anyone but seller tries to issue refund", async()=>{
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});
            await expect(market.refundBuyer(1)).to.be.reverted;
        })
    })
    describe("refundSeller", ()=>{
        it("Should allow the seller to withdraw initial value of service after contract conclusion", async ()=> {
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});

            const tokenInstance = await ethers.getContractFactory("ServicePurchase");
            const token = await tokenInstance.deploy(market.address);
            await token.connect(buyer).createToken("0");
            await market.connect(buyer).confirmServiceConclusion(1, 1, token.address);
            expect(await market.connect(seller).refundSeller(1, 1000)).to.emit(market, "ServiceClosed");
        })
        it("Should revert if anyone but the seller tries to withdraw after contract conclusion", async() =>{
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});

            const tokenInstance = await ethers.getContractFactory("ServicePurchase");
            const token = await tokenInstance.deploy(market.address);
            await token.connect(buyer).createToken("0");
            await market.connect(buyer).confirmServiceConclusion(1, 1, token.address);
            await expect(market.refundSeller(1,1000)).to.be.reverted;
        })
    })
    describe("fetchAvailableServices", () => {
        it("Should query all available services", async ()=> {
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(seller).createService(30, {value: 1000});
            let services = await market.fetchAvailableServices();
            services = await Promise.all(services.map(async i => {
                let listing = {
                itemId: i.itemId.toString(),
                price: i.value.toString(),
                duration: i.duration.toString(),
                state: i.state,
                seller: i.seller,
                buyer: i.buyer,
                }
                return listing;
            }));
            console.log("Services: ", services);
        });
    });
    describe("fetchMyServices", () => {
        it("Should query all services I have purchased", async() => {
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(buyer).purchaseService(1, {value: 2000});
            await market.connect(buyer).purchaseService(2, {value: 2000});
            let services = await market.connect(buyer).fetchMyServices();
            services = await Promise.all(services.map(async i => {
                let listing = {
                itemId: i.itemId.toString(),
                price: i.value.toString(),
                duration: i.duration.toString(),
                state: i.state,
                seller: i.seller,
                buyer: i.buyer,
                }
                return listing;
            }));
            console.log("Services: ", services);
        });
    });
    describe("fetchServicesCreated", () => {
        it("Should query all services I have created", async() => {
            await market.connect(seller).createService(30, {value: 1000});
            await market.connect(seller).createService(30, {value: 1000});
            let services = await market.connect(seller).fetchServicesCreated();
            services = await Promise.all(services.map(async i => {
                let listing = {
                itemId: i.itemId.toString(),
                price: i.value.toString(),
                duration: i.duration.toString(),
                state: i.state,
                seller: i.seller,
                buyer: i.buyer,
                }
                return listing;
            }));
            console.log("Services: ", services);
        });
    });

});