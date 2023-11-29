import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, agent } = await getNamedAccounts();

  const res = await deploy("PPAgentSafeModule", {
    from: deployer,
    args: [agent],
  });

  console.log(`Module address: ${res.address}`);
};

export default func;
func.tags = ["Module"];
