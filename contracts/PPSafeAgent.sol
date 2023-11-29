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
     * @notice
     */
    mapping(bytes32 => Job) internal jobs;

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

    /**
     *
     * @param interval Interval in seconds
     * @param isActive boolean
     * @param tx_ Transaction which will be whitelisted to be executed
     */
    function updateJob(
        uint24 interval,
        bool isActive,
        Tx calldata tx_
    ) external {
        Job storage job = jobs[keccak256(abi.encode(msg.sender, tx_))];

        job.isActive = isActive;
        job.intervalSeconds = interval;
    }

    /**
     *
     * @param safe Address of a Safe smart contract
     * @param tx_ Transaction to be executed
     */
    function exec(address safe, Tx calldata tx_) external onlyAgent {
        Job storage job = jobs[keccak256(abi.encode(safe, tx_))];

        if (!job.isActive) revert InactiveJob();

        uint256 nextExecutionAt;
        unchecked {
            nextExecutionAt = job.lastExecutionAt + job.intervalSeconds;
        }
        if (nextExecutionAt > block.timestamp) {
            revert IntervalNotReached();
        }

        job.lastExecutionAt = uint32(block.timestamp);

        (bool success, ) = ISafe(safe).execTransactionFromModuleReturnData(
            tx_.to,
            tx_.value,
            tx_.data,
            tx_.operation
        );

        if (!success) revert ExecutionReverted();
    }

    function getJobInfo(
        address safe,
        Tx calldata tx_
    ) external view returns (Job memory) {
        return jobs[keccak256(abi.encode(safe, tx_))];
    }
}
