import { ethers, getNamedAccounts, deployments } from "hardhat";
import { IPPAgentV2JobOwner } from "../typechain-types/IPPAgentV2.sol/IPPAgentV2JobOwner";
import { IPPAgentSafeModule } from "../typechain-types";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import Safe, {
  CreateTransactionProps,
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@safe-global/protocol-kit";

async function main() {
  const { agent } = await getNamedAccounts();
  const moduleAddress = (await deployments.get("PPAgentSafeModule")).address;
  const agentContract = await ethers.getContractAt("IPPAgentV2JobOwner", agent);
  let safeAddress: string;

  const safeOwner = new ethers.Wallet(
    process.env.DEPLOYER_PRIVATE_KEY!,
    ethers.provider.provider
  );

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: safeOwner,
  });

  let safeSdk: Safe;

  if (process.env.SAFE_WALLET_ADDRESS) {
    safeAddress = process.env.SAFE_WALLET_ADDRESS;
    safeSdk = await Safe.create({ ethAdapter, safeAddress });
    console.log(`Safe Wallet address provided: ${safeAddress}`);
  } else {
    console.log(`Safe Wallet is not provided and will be deployed!`);
    const factory = await SafeFactory.create({ ethAdapter });
    const safeAccountConfig: SafeAccountConfig = {
      owners: [safeOwner.address],
      threshold: 1,
    };
    safeSdk = await factory.deploySafe({
      safeAccountConfig,
    });
    safeAddress = await safeSdk.getAddress();
    console.log(`Safe Wallet deployed at: ${safeAddress}`);
  }

  const receiverAddress = (await safeSdk.getOwners())[0];

  const module = await ethers.getContractAt("PPAgentSafeModule", moduleAddress);

  const params: IPPAgentV2JobOwner.RegisterJobParamsStruct = {
    jobAddress: moduleAddress,
    jobSelector: "0x00000000",
    useJobOwnerCredits: true,
    assertResolverSelector: false,
    maxBaseFeeGwei: 1000,
    rewardPct: 0,
    fixedReward: 5000,
    jobMinCvp: 1000,
    calldataSource: 1,
    intervalSeconds: 86400,
  };
  const resolver: IPPAgentV2JobOwner.ResolverStruct = {
    resolverAddress: "0x0000000000000000000000000000000000000000",
    resolverCalldata: "0x",
  };
  const tx: IPPAgentSafeModule.TxStruct = {
    to: receiverAddress,
    data: "0x",
    value: "0",
    operation: "0",
  };

  const calldata = module.interface.encodeFunctionData("exec", [
    safeAddress,
    tx,
  ]);

  const transactions: MetaTransactionData[] = [];

  if ((await safeSdk.isModuleEnabled(moduleAddress)) == false) {
    console.log("Module is not enabled");
    const enableModuleTx = await safeSdk.createEnableModuleTx(moduleAddress);
    const enableModuleMetaTx = {
      to: enableModuleTx.data.to,
      value: enableModuleTx.data.value,
      data: enableModuleTx.data.data,
      operation: enableModuleTx.data.operation,
    };
    transactions.push(enableModuleMetaTx);
  }

  const jobInfo = await module.getJobInfo(safeAddress, tx);
  if (jobInfo.isActive == false) {
    console.log("Job is not enabled in the Module");

    const updateJobData = await module.interface.encodeFunctionData(
      "updateJob",
      [params.intervalSeconds, true, tx]
    );

    const updateJobMetaTx: MetaTransactionData = {
      to: moduleAddress,
      value: "0",
      data: updateJobData,
    };
    transactions.push(updateJobMetaTx);
  }

  const props: CreateTransactionProps = {
    transactions,
  };

  let res;
  if (transactions.length > 0) {
    const safeTx = await safeSdk.createTransaction(props);
    res = await safeSdk.executeTransaction(safeTx);
    console.log(`Safe TX: ${res.hash}`);
    await res.transactionResponse?.wait(2);
  }

  res = await agentContract.registerJob(params, resolver, calldata);
  console.log(`RegisterJob TX: ${res.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
