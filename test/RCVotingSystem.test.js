const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("BallotContract", function () {
    let BallotContract, ballotContract, owner, addr1, vote, vote1, vote2, vote3

    beforeEach(async function () {
        BallotContract = await ethers.getContractFactory("BallotContract")
        ;[owner, addr1] = await ethers.getSigners()
        ballotContract = await BallotContract.deploy()
    })

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await ballotContract.getOwner()).to.equal(owner.address)
        })
    })

    describe("voteBallot", function () {
        it("Should allow voting", async function () {
            vote1 = "Candidate 1"
            vote2 = "Candidate 2"
            vote3 = "Candidate 3"
            vote = await ballotContract
                .connect(addr1)
                .voteBallot(vote1, vote2, vote3)
            await vote.wait()
            expect(await ballotContract.getVoterChoices(addr1)).to.deep.equal([
                vote1,
                vote2,
                vote3,
            ])
        })
    })
})
