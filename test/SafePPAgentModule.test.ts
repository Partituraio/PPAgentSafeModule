import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { IPPAgentV2JobOwner } from "../typechain-types/IPPAgentV2.sol/IPPAgentV2JobOwner";

import Safe, {
  SafeAccountConfig,
  SafeFactory,
  EthersAdapter,
  ContractNetworksConfig,
} from "@safe-global/protocol-kit";

describe("Safe PowerPool Agent V2 Module", function () {
  async function deployContractsFixture() {
    // deploy and return SafeFactory, Safe

    const owner = await ethers.getSigners();
    const safeAccountConfig: SafeAccountConfig = {
      owners: [owner[0].address],
      threshold: 1,
    };

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: await ethers.provider.getSigner(),
    });

    const safeSingletonAddress = await (
      await (await ethers.getContractFactory("SafeL2")).deploy()
    ).getAddress();

    const safeProxyFactoryAddress = await (
      await (await ethers.getContractFactory("SafeProxyFactory")).deploy()
    ).getAddress();

    const multiSendAddress = await (
      await (await ethers.getContractFactory("MultiSend")).deploy()
    ).getAddress();

    const multiSendCallOnlyAddress = await (
      await (await ethers.getContractFactory("MultiSendCallOnly")).deploy()
    ).getAddress();

    const fallbackHandlerAddress = await (
      await (
        await ethers.getContractFactory("CompatibilityFallbackHandler")
      ).deploy()
    ).getAddress();

    const signMessageLibAddress = await (
      await (await ethers.getContractFactory("SignMessageLib")).deploy()
    ).getAddress();

    const createCallAddress = await (
      await (await ethers.getContractFactory("CreateCall")).deploy()
    ).getAddress();

    const simulateTxAccessorAddress = await (
      await (await ethers.getContractFactory("SimulateTxAccessor")).deploy()
    ).getAddress();

    const mockAgentContract = await (
      await ethers.getContractFactory("MockPPAgentV2")
    ).deploy();

    const PPAgentSafeModule = await (
      await ethers.getContractFactory("PPAgentSafeModule")
    ).deploy((await mockAgentContract).getAddress());

    const chainId = await ethAdapter.getChainId();

    const contractNetworks: ContractNetworksConfig = {
      [chainId.toString()]: {
        safeSingletonAddress,
        safeProxyFactoryAddress,
        multiSendAddress,
        multiSendCallOnlyAddress,
        fallbackHandlerAddress,
        signMessageLibAddress,
        createCallAddress,
        simulateTxAccessorAddress,
      },
    };

    const safeFactory = await SafeFactory.create({
      ethAdapter,
      contractNetworks,
      safeVersion: "1.4.1",
    });

    const safeSdk: Safe = await safeFactory.deploySafe({
      safeAccountConfig,
    });

    owner[0].sendTransaction({
      to: await safeSdk.getAddress(),
      value: ethers.parseUnits("1", "ether"),
    });

    const moduleAddress = await PPAgentSafeModule.getAddress();
    const enableModuleTx = await safeSdk.createEnableModuleTx(moduleAddress);
    await safeSdk.executeTransaction(enableModuleTx);

    return { safeSdk, mockAgentContract, PPAgentSafeModule };
  }

  it("Should create and execute a task", async () => {
    const { safeSdk, mockAgentContract, PPAgentSafeModule } = await loadFixture(
      deployContractsFixture
    );

    const moduleAddress = await PPAgentSafeModule.getAddress();
    const safeAddress = await safeSdk.getAddress();

    const receiverAddress = (await ethers.getSigners())[2].address;

    const txs: MetaTransactionData[] = [
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
    ];

    const txToExec = await safeSdk.createTransaction({ transactions: txs });

    const calldata = PPAgentSafeModule.interface.encodeFunctionData("exec", [
      safeAddress,
      txToExec.data,
    ]);

    const jobKey = ethers.zeroPadBytes(safeAddress, 32);

    const safeBalanceBefore = await ethers.provider.getBalance(safeAddress);

    await mockAgentContract.execute(moduleAddress, jobKey, calldata);

    const safeBalanceAfter = await ethers.provider.getBalance(safeAddress);

    expect(safeBalanceBefore - safeBalanceAfter).to.be.equal(2n);
  });

  it("Should not execute transaction not from AgentContract", async () => {
    const { safeSdk, mockAgentContract, PPAgentSafeModule } = await loadFixture(
      deployContractsFixture
    );

    const signers = await ethers.getSigners();

    const moduleAddress = await PPAgentSafeModule.getAddress();
    const safeAddress = await safeSdk.getAddress();

    const receiverAddress = (await ethers.getSigners())[2].address;

    const txs: MetaTransactionData[] = [
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
    ];

    const txToExec = await safeSdk.createTransaction({ transactions: txs });

    let calldata = PPAgentSafeModule.interface.encodeFunctionData("exec", [
      safeAddress,
      txToExec.data,
    ]);

    const jobKey = ethers.zeroPadBytes(safeAddress, 32);

    calldata = calldata + jobKey;

    await expect(
      PPAgentSafeModule.exec(safeAddress, txToExec.data)
    ).to.be.revertedWithCustomError(PPAgentSafeModule, "InvalidSender");
  });

  it("Should not execute transaction with invalid jobkey", async () => {
    const { safeSdk, mockAgentContract, PPAgentSafeModule } = await loadFixture(
      deployContractsFixture
    );

    const moduleAddress = await PPAgentSafeModule.getAddress();
    const safeAddress = await safeSdk.getAddress();

    const receiverAddress = (await ethers.getSigners())[2].address;

    const txs: MetaTransactionData[] = [
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
      {
        to: receiverAddress,
        data: "0x",
        value: "1",
      },
    ];

    const txToExec = await safeSdk.createTransaction({ transactions: txs });

    const calldata = PPAgentSafeModule.interface.encodeFunctionData("exec", [
      safeAddress,
      txToExec.data,
    ]);

    const jobKey = ethers.randomBytes(32);

    await expect(mockAgentContract.execute(moduleAddress, jobKey, calldata)).to
      .be.reverted;
  });
});
