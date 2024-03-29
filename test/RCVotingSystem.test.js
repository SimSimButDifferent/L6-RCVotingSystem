const { expect } = require("chai")
const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers")

describe("VotingContract", function () {
    let VotingContract,
        votingContract,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        vote,
        rankedChoices,
        BallotContract,
        ballotContract,
        ballotContractAddress,
        addElection,
        election1id,
        election2id,
        oneDay

    beforeEach(async function () {
        ;[owner, addr1, addr2, addr3, addr4] = await ethers.getSigners()

        BallotContract = await ethers.getContractFactory("BallotContract")
        ballotContract = await BallotContract.deploy()
        ballotContractAddress = ballotContract.target
        VotingContract = await ethers.getContractFactory("VotingContract")
        votingContract = await VotingContract.deploy(ballotContractAddress)
        rankedChoices = [0, 1, 2]
        election1id = 1
        election2id = 2
        oneDay = 1
        candidate1 = "candidate 1"
        candidate2 = "candidate 2"
        candidate3 = "candidate 3"

        addElection = await ballotContract.addElection(
            [candidate1, candidate2, candidate3],
            oneDay,
        )
    })

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await votingContract.getOwner()).to.equal(owner.address)
        })
    })

    describe("vote", function () {
        it("Reverts if voter has already voted", async function () {
            vote = await votingContract
                .connect(addr1)
                .addVotes(rankedChoices, oneDay)
            await expect(
                votingContract.connect(addr1).addVotes(rankedChoices, 1),
            ).to.be.revertedWith("Voter has already voted")
        })

        it("Reverts if election does not exist", async function () {
            await expect(
                votingContract.connect(addr1).addVotes(rankedChoices, 0),
            ).to.be.revertedWith("Election does not exist")
            await expect(
                votingContract.connect(addr1).addVotes(rankedChoices, 2),
            ).to.be.revertedWith("Election does not exist")
            await expect(
                votingContract.connect(addr1).addVotes(rankedChoices, 100),
            ).to.be.revertedWith("Election does not exist")
        })

        it("Reverts if election is closed", async function () {
            await time.increase(2 * 24 * 60 * 60)

            await ballotContract.connect(owner).closeElection(election1id)

            await expect(
                votingContract
                    .connect(addr1)
                    .addVotes(rankedChoices, election1id),
            ).to.be.revertedWith("Election is closed")
        })

        it("Reverts if there is a different number of candidates", async function () {
            await expect(
                votingContract.connect(addr1).addVotes([1, 2], 1),
            ).to.be.revertedWith(
                "The amount of votes does not match the amount of candidates",
            )
            await expect(
                votingContract.connect(addr1).addVotes([1, 2, 3, 4], 1),
            ).to.be.revertedWith(
                "The amount of votes does not match the amount of candidates",
            )
        })

        it("Should allow a voter to vote", async function () {
            vote = await votingContract
                .connect(addr1)
                .addVotes(rankedChoices, oneDay)
            expect(
                await votingContract.getVoterChoices(addr1, election1id),
            ).to.deep.equal(rankedChoices)
        })

        it("Voter status updates correctly", async function () {
            expect(
                await votingContract.getVoterStatus(addr1, election1id),
            ).to.equal(false)

            vote = await votingContract
                .connect(addr1)
                .addVotes(rankedChoices, oneDay)
            expect(
                await votingContract.getVoterStatus(addr1, election1id),
            ).to.equal(true)
        })

        it("Should update the candidateVoteCount mapping correctly", async function () {
            vote = await votingContract
                .connect(addr1)
                .addVotes(rankedChoices, 1)
            expect(
                await ballotContract.getCandidateVoteCount(
                    election1id,
                    candidate1,
                ),
            ).to.deep.equal([1, 0, 0])
            expect(
                await ballotContract.getCandidateVoteCount(
                    election1id,
                    candidate2,
                ),
            ).to.deep.equal([0, 1, 0])
            expect(
                await ballotContract.getCandidateVoteCount(
                    election1id,
                    candidate3,
                ),
            ).to.deep.equal([0, 0, 1])
        })

        it("should count multiple votes properly", async function () {
            candidate4 = "candidate 4"

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3, candidate4],
                oneDay,
            )

            await votingContract.connect(addr1).addVotes([0, 1, 2, 3], 2)
            await votingContract.connect(addr3).addVotes([2, 3, 0, 1], 2)
            await votingContract.connect(addr4).addVotes([1, 2, 3, 0], 2)
            await votingContract.connect(addr2).addVotes([1, 2, 3, 0], 2)

            expect(
                await ballotContract.getCandidateVoteCount(2, candidate1),
            ).to.deep.equal([1, 0, 1])
            expect(
                await ballotContract.getCandidateVoteCount(2, candidate2),
            ).to.deep.equal([2, 1, 0])
            expect(
                await ballotContract.getCandidateVoteCount(2, candidate3),
            ).to.deep.equal([1, 2, 1])
            expect(
                await ballotContract.getCandidateVoteCount(2, candidate4),
            ).to.deep.equal([0, 1, 2])
        })

        it("Should emit a VoteCast event", async function () {
            vote = await votingContract
                .connect(addr1)
                .addVotes(rankedChoices, oneDay)
            await expect(vote).to.emit(votingContract, "VoteCast")
        })
    })

    describe("getVoterChoices", function () {
        it("Should revert if account has not voted", async function () {
            await expect(
                votingContract.getVoterChoices(addr1, election1id),
            ).to.be.revertedWith("Voter has not voted")
        })
    })

    describe("GetElectionCandidates", function () {
        it("Returns election candidates to Voting Contract", async function () {
            expect(await votingContract.getElectionCandidates(1)).to.deep.equal(
                ["candidate 1", "candidate 2", "candidate 3"],
            )
        })
    })
    describe("GetElectionStatus", function () {
        it("Returns election status to Voting Contract", async function () {
            expect(await votingContract.getElectionStatus(1)).to.equal(true)
        })
    })
})

describe("BallotContract", function () {
    let BallotContract,
        ballotContract,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        candidatesList,
        candidate1,
        candidate2,
        candidate3,
        electionTimeLimit,
        electionStartTime,
        electionEndTime

    beforeEach(async function () {
        BallotContract = await ethers.getContractFactory("BallotContract")
        ;[owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()
        ballotContract = await BallotContract.deploy()

        candidate1 = "Candidate 1"
        candidate2 = "Candidate 2"
        candidate3 = "Candidate 3"
    })

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await ballotContract.getOwner()).to.equal(owner.address)
        })
    })

    describe("addElection", function () {
        beforeEach(async function () {
            electionTimeLimit = 1

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3],
                electionTimeLimit,
            )

            candidatesList = await ballotContract.getElectionCandidates(1)
            electionStatus = await ballotContract.getElectionStatus(1)
            electionStartTime = await ballotContract.getElectionStartTime(1)
            electionEndTime = await ballotContract.getElectionEndTime(1)
        })

        it("onlyOwner can add an election", async function () {
            await expect(
                ballotContract
                    .connect(addr1)
                    .addElection(
                        ["Candidate 1", "Candidate 2", "Candidate 3"],
                        electionTimeLimit,
                    ),
            ).to.be.revertedWith("Only the owner can call this function")
        })
        it("Reverts is there is only one candidate", async function () {
            await expect(
                ballotContract.addElection(["only1Candidate"], 1),
            ).to.be.revertedWith("There must be more than one candidate")
        })

        it("Reverts if there are more than 5 candidates", async function () {
            await expect(
                ballotContract.addElection(
                    [
                        "Candidate1/6",
                        "Candidate2/6",
                        "Candidate3/6",
                        "Candidate4/6",
                        "Candidate5/6",
                        "Candidate6/6",
                    ],
                    electionTimeLimit,
                ),
            ).to.be.revertedWith(
                "An election can have a maximum of 5 candidates",
            )
        })

        it("Succesfully creates and maps an election", async function () {
            expect(await ballotContract.getElection(1)).to.deep.equal([
                candidatesList,
                electionStartTime,
                electionEndTime,
                electionStatus,
            ])
        })

        it("Should correctly set electionOpen bool to true", async function () {
            expect(await ballotContract.getElectionStatus(1)).to.equal(true)
        })

        it("Should incriment the Election count after each election", async function () {
            const electionCount = await ballotContract.getElectionCount()
            const counterIncriment = ethers.parseUnits("1", 0)
            await ballotContract.addElection(
                ["Candidate 1", "Candidate 2", "Candidate 3"],
                electionTimeLimit,
            )
            expect(await ballotContract.getElectionCount()).to.equal(
                electionCount + counterIncriment,
            )
        })

        it("Adds electionId to openElections array", async function () {
            expect(await ballotContract.getOpenElections()).to.deep.equal([1])
        })

        it("Should add candidates to the candidateVoteCount mapping", async function () {
            expect(
                await ballotContract.getCandidateVoteCount(1, candidate1),
            ).to.deep.equal([0, 0, 0])
        })

        it("Should emit an ElectionCreated event", async function () {
            await expect(
                ballotContract.addElection(
                    ["Candidate 1", "Candidate 2", "Candidate 3"],
                    electionTimeLimit,
                ),
            ).to.emit(ballotContract, "ElectionCreated")
        })
    })

    describe("closeElection", function () {
        beforeEach(async function () {
            electionTimeLimit = 1

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3],
                electionTimeLimit,
            )

            await time.increase(electionTimeLimit * 24 * 60 * 60)
        })

        it("onlyOwner can close an election", async function () {
            await expect(
                ballotContract.connect(addr1).closeElection(1),
            ).to.be.revertedWith("Only the owner can call this function")
        })

        it("Reverts if election does not exist", async function () {
            await expect(ballotContract.closeElection(0)).to.be.revertedWith(
                "Election does not exist",
            )
            await expect(ballotContract.closeElection(100)).to.be.revertedWith(
                "Election does not exist",
            )
        })

        it("Reverts if election is already closed", async function () {
            const closedElection = await ballotContract.closeElection(1)
            closedElection.wait()
            await expect(ballotContract.closeElection(1)).to.be.revertedWith(
                "Election is already closed",
            )
        })

        it("Succesfully closes an election and sets status to closed", async function () {
            const closedElection = await ballotContract.closeElection(1)
            await closedElection.wait()
            expect(await ballotContract.getElectionStatus(1)).to.equal(false)
        })

        it("Should succesfully pick the correct winner and emit event", async function () {
            const candidate4 = "candidate 4"

            const ballotContractAddress = ballotContract.target
            VotingContract = await ethers.getContractFactory("VotingContract")
            votingContract = await VotingContract.deploy(ballotContractAddress)

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3, candidate4],
                electionTimeLimit,
            )

            await votingContract.connect(addr1).addVotes([0, 1, 2, 3], 2)
            await votingContract.connect(addr3).addVotes([2, 3, 0, 1], 2)
            await votingContract.connect(addr4).addVotes([1, 2, 3, 0], 2)
            await votingContract.connect(addr2).addVotes([1, 2, 3, 0], 2)

            await time.increase(electionTimeLimit * 24 * 60 * 60)

            const closedElection = await ballotContract.closeElection(2)
            await expect(closedElection).to.emit(ballotContract, "TheWinnerIs")
            await closedElection.wait()

            expect(await ballotContract.getElectionWinner(2)).to.equal(
                candidate2,
            )
        })

        it("Should pick the correct winner if first votes are tied", async function () {
            const ballotContractAddress = ballotContract.target
            VotingContract = await ethers.getContractFactory("VotingContract")
            votingContract = await VotingContract.deploy(ballotContractAddress)

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3],
                electionTimeLimit,
            )

            await votingContract.connect(addr1).addVotes([0, 1, 2], 2)
            await votingContract.connect(addr2).addVotes([0, 1, 2], 2)
            await votingContract.connect(addr3).addVotes([1, 0, 2], 2)
            await votingContract.connect(addr4).addVotes([1, 2, 0], 2)

            await time.increase(electionTimeLimit * 24 * 60 * 60)

            const closedElection = await ballotContract.closeElection(2)
            await expect(closedElection).to.emit(ballotContract, "TheWinnerIs")
            await closedElection.wait()

            expect(await ballotContract.getElectionWinner(2)).to.equal(
                candidate2,
            )
        })

        it("Should pick the correct winner if second votes are tied", async function () {
            const candidate4 = "candidate 4"

            const ballotContractAddress = ballotContract.target
            VotingContract = await ethers.getContractFactory("VotingContract")
            votingContract = await VotingContract.deploy(ballotContractAddress)

            await ballotContract.addElection(
                [candidate1, candidate2, candidate3, candidate4],
                electionTimeLimit,
            )

            await votingContract.connect(addr1).addVotes([0, 1, 2, 3], 2)
            await votingContract.connect(addr2).addVotes([0, 1, 2, 3], 2)
            await votingContract.connect(addr3).addVotes([1, 0, 2, 3], 2)
            await votingContract.connect(addr4).addVotes([1, 0, 2, 3], 2)
            await votingContract.connect(addr5).addVotes([3, 2, 0, 1], 2)

            await time.increase(electionTimeLimit * 24 * 60 * 60)

            const closedElection = await ballotContract.closeElection(2)
            await expect(closedElection).to.emit(ballotContract, "TheWinnerIs")
            await closedElection.wait()

            expect(await ballotContract.getElectionWinner(2)).to.equal(
                candidate1,
            )
        })

        it("Should emit an ElectionClosed event", async function () {
            await expect(ballotContract.closeElection(1)).to.emit(
                ballotContract,
                "ElectionClosed",
            )
        })

        it("Should revert if time is not up", async function () {
            await ballotContract.addElection(
                [candidate1, candidate2, candidate3],
                electionTimeLimit,
            )
            await expect(ballotContract.closeElection(2)).to.be.revertedWith(
                "Election is still open",
            )
        })

        it("Adds electionId to closedElections array", async function () {
            const closedElection = await ballotContract.closeElection(1)
            await closedElection.wait()
            expect(await ballotContract.getClosedElections()).to.deep.equal([1])
        })

        it("Removes electionId from openElections array", async function () {
            const closedElection = await ballotContract.closeElection(1)
            await closedElection.wait()
            expect(await ballotContract.getOpenElections()).to.deep.equal([])
        })
    })
})
