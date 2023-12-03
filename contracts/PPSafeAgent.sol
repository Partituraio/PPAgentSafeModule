// SPDX-License-Identifier: UNLICENSED

import "./ISafe.sol";
import {IPPAgentV2JobOwner} from "./IPPAgentV2.sol";
import {IPPAgentSafeModule} from "./IPPSafeAgent.sol";

pragma solidity ^0.8.9;

contract PPAgentSafeModule is IPPAgentSafeModule {
    /**
     * @dev Address of the PPAgent Contract
     */
    address private immutable AgentContract;

    /**
     *
     * @param agentAddress Address of a PPAgent contract
     */
    constructor(address agentAddress) {
        AgentContract = agentAddress;
    }

    modifier onlyAgent() {
        if (msg.sender != AgentContract) revert InvalidSender();
        _;
    }

    modifier onlyAssignedKeeper(address safe) {
        address[] memory owners = ISafe(safe).getOwners();
        IPPAgentV2JobOwner agent = IPPAgentV2JobOwner(AgentContract);
        for (uint256 i = 1; i < type(uint256).max; i++) {
            bytes32 jobKey = agent.getJobKey(address(this), i);
            (address jobOwner, , , , , ) = agent.getJob(jobKey);
            if (jobOwner == address(0)) {
                revert();
            }
            uint256 keeperId = agent.jobNextKeeperId(jobKey);
            (, address worker, , , , , , ) = agent.getKeeper(keeperId);
            if (worker == tx.origin && jobOwner == owners[0]) {
                _;
                break;
            }
        }
    }

    /**
     *
     * @param safe Address of a Safe smart contract
     * @param tx_ Transaction to be executed
     */
    function exec(
        address safe,
        Tx calldata tx_
    ) external onlyAssignedKeeper(safe) {
        (bool success, ) = ISafe(safe).execTransactionFromModuleReturnData(
            tx_.to,
            tx_.value,
            tx_.data,
            tx_.operation
        );

        if (!success) revert ExecutionReverted();
    }
}
