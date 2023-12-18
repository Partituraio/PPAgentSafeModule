import { ethers, getNamedAccounts, deployments } from "hardhat";
import { IPPAgentV2JobOwner } from "../typechain-types/IPPAgentV2.sol/IPPAgentV2JobOwner";
import { IPPAgentSafeModule } from "../typechain-types";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import Safe, {
  CreateTransactionProps,
  EthersAdapter,
} from "@safe-global/protocol-kit";

async function main() {
  const { agent } = await getNamedAccounts();
  const moduleAddress = (await deployments.get("PPAgentSafeModule")).address;
  const agentContract = await ethers.getContractAt("IPPAgentV2JobOwner", agent);
  const safeAddress = process.env.SAFE_WALLET_ADDRESS!;

  const safeOwner = new ethers.Wallet(
    process.env.DEPLOYER_PRIVATE_KEY!,
    ethers.provider.provider
  );

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: safeOwner,
  });

  let safeSdk: Safe;

  safeSdk = await Safe.create({ ethAdapter, safeAddress });

  // Test Job contains a transaction which
  // send 1 wei (xDAI) to the owner of the Safe Wallet
  // registerJob top-ups the balance of the job on 0.05 (xDAI)
  const receiverAddress = (await safeSdk.getOwners())[0];

  const tx: IPPAgentSafeModule.TxStruct = {
    to: receiverAddress,
    data: "0x",
    value: "1",
    operation: "0",
  };

  const module = await ethers.getContractAt("PPAgentSafeModule", moduleAddress);

  const params: IPPAgentV2JobOwner.RegisterJobParamsStruct = {
    jobAddress: moduleAddress,
    jobSelector: "0x00000000",
    useJobOwnerCredits: false,
    assertResolverSelector: false,
    maxBaseFeeGwei: 1000,
    rewardPct: 0,
    fixedReward: 5000,
    jobMinCvp: 1000,
    calldataSource: 1,
    intervalSeconds: 250,
  };
  const resolver: IPPAgentV2JobOwner.ResolverStruct = {
    resolverAddress: "0x0000000000000000000000000000000000000000",
    resolverCalldata: "0x",
  };

  const calldata = module.interface.encodeFunctionData("exec", [
    safeAddress,
    tx,
  ]);

  const transactions: MetaTransactionData[] = [];

  if ((await safeSdk.isModuleEnabled(moduleAddress)) == false) {
    console.log("Module is not enabled");
    const enableModuleTx = await safeSdk.createEnableModuleTx(moduleAddress);
    const enableModuleMetaTx: MetaTransactionData = {
      to: enableModuleTx.data.to,
      value: enableModuleTx.data.value,
      data: enableModuleTx.data.data,
      operation: enableModuleTx.data.operation,
    };
    transactions.push(enableModuleMetaTx);
  }

  const registerJobMetaTx: MetaTransactionData = {
    to: await agentContract.getAddress(),
    value: ethers.parseEther("0.05").toString(),
    data: await agentContract.interface.encodeFunctionData("registerJob", [
      params,
      resolver,
      calldata,
    ]),
  };

  transactions.push(registerJobMetaTx);

  const props: CreateTransactionProps = {
    transactions,
  };

  let res;
  if (transactions.length > 0) {
    const safeTx = await safeSdk.createTransaction(props);
    res = await safeSdk.executeTransaction(safeTx);
    console.log(`Safe TX: ${res.hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
