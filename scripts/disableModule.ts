import { ethers, deployments } from "hardhat";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";

async function main() {
  const moduleAddress = (await deployments.get("PPAgentSafeModule")).address;
  const safeAddress = process.env.SAFE_WALLET_ADDRESS!;

  const safeOwner = new ethers.Wallet(
    process.env.DEPLOYER_PRIVATE_KEY!,
    ethers.provider.provider
  );

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: safeOwner,
  });

  const safeSdk = await Safe.create({ ethAdapter, safeAddress });

  if ((await safeSdk.isModuleEnabled(moduleAddress)) == false) {
    console.log("The Module is disabled");
    return;
  }

  const disableModuleTx = await safeSdk.createDisableModuleTx(moduleAddress);

  const res = await safeSdk.executeTransaction(disableModuleTx);
  console.log(`Enable Module TX: ${res.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
