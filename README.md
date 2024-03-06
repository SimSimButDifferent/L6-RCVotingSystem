# Ranked Choice Voting System
This project is to explore smart contract interaction.

### My main aims for my voting system are:
- To use multiple smart contracts interacting together.
- Create and properly utilize a smart contract interface.
- Maybe explore a factory contract.
- The owner can create multiple elections / polls if need be.
- the owner sets the names of the participants.
- The time limit for them can be set in days.
- The will be a maximum number of people / things to vote for.

## To run locally

```bash
git clone https://github.com/SimSimButDifferent/L6-RCVotingSystem.git

yarn
```

```bash
yarn hardhat node
yarn hardhat run scripts/deploy.js --network localhost
yarn hardhat test
```

**To play around with a front end, paste into Remix IDE ---> remix.ethereum.org**

## Lesson 6: Smart Contract Interactions

**Objective:**

This lesson focuses on understanding how smart contracts interact with each other on the Ethereum blockchain. Learning about contract interactions is crucial for building decentralized applications (dApps) that require collaboration between multiple contracts.

#### Part 1: Calling External Contracts

**Direct Calls:**

Explain how to interact with other contracts directly using their addresses and function signatures. This method is suitable for simple interactions and when the interface of the external contract is known and stable.
**Interface Contracts:**

Introduce the concept of interfaces in Solidity, which define the functions of an external contract without their implementation. Using interfaces is a cleaner and more error-proof method for contract interactions.
**Example of Direct Call:**

```solidity
pragma solidity ^0.8.0;

contract ExternalContract {
    function externalFunction() public pure returns (string memory) {
        return "External function called";
    }
}

contract Caller {
    function callExternalFunction(address _contractAddress) public view returns (string memory) {
        ExternalContract externalContract = ExternalContract(_contractAddress);
        return externalContract.externalFunction();
    }
}
```

## Part 2: Using Interfaces for Contract Interactions

**Defining and Implementing an Interface:**

Show how to define an interface and use it to interact with an external contract. Interfaces allow a contract to call functions of another contract as if it were calling its own functions, promoting loose coupling between contracts.
Example Using an Interface:

```solidity
interface IExternalContract {
    function externalFunction() external view returns (string memory);
}

contract ExternalContract is IExternalContract {
    function externalFunction() external pure override returns (string memory) {
        return "External function called";
    }
}

contract Caller {
    IExternalContract externalContract;

    constructor(address _contractAddress) {
        externalContract = IExternalContract(_contractAddress);
    }

    function callExternalFunction() public view returns (string memory) {
        return externalContract.externalFunction();
    }
}
```

## Part 3: Handling Contract Dependencies

**Contract Creation from Another Contract:**

Discuss how contracts can create other contracts using the new keyword, establishing dependencies between them. This is useful for factory patterns and when deploying multiple instances of a contract from a single contract is needed.

**Address and ABI:**

Explain the importance of knowing the address and the Application Binary Interface (ABI) of the external contract for interaction. The ABI is a JSON representation that describes how to call functions in a contract and is automatically generated by the Solidity compiler.

## Part 4: Considerations and Best Practices

**Gas Considerations:**

Understand the gas implications of external calls and how they can affect the contract's execution cost.

**Security Implications:**
Highlight common security considerations such as reentrancy attacks and how to mitigate them using patterns like checks-effects-interactions.

**Upgradability and Modularity:** Discuss strategies for designing contracts with upgradability and modularity in mind, using proxy contracts or the diamond standard (EIP-2535).

---

## Assignments and Practical Exercises

**Assignment 1:**

Research and write an essay on the importance of interfaces in facilitating smart contract interactions, including how they contribute to the modularity and upgradability of dApps.

**Exercise 1:**

Create two contracts where one contract calls a function of the other contract using direct calls and interfaces. Demonstrate the use of both methods and compare them in terms of ease of use and flexibility.

**Exercise 2:**

Implement a contract that creates instances of another contract and interacts with them. This could simulate a simple factory pattern, showcasing how contracts can manage dependencies and create complex ecosystems.

---

This lesson provides a foundational understanding of how smart contracts interact within the Ethereum ecosystem. Mastering contract interactions is essential for building complex, efficient, and secure dApps that leverage the full potential of decentralized technologies.
