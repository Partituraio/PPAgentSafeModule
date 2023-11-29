// SPDX-License-Identifier: UNLICENSED

import "./ISafe.sol";
import {IPPAgentV2JobOwner} from "./IPPAgentV2.sol";

pragma solidity ^0.8.9;

interface IPPAgentSafeModule {
    struct Tx {
        address to;
        bytes data;
        uint256 value;
        ISafe.Operation operation;
    }

    struct Job {
        bool isActive;
        uint24 intervalSeconds;
        uint32 lastExecutionAt;
    }

    error ExecutionReverted();
    error InactiveJob();
    error InvalidSender();
    error IntervalNotReached();

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
    ) external;

    /**
     *
     * @param safe Address of a Safe smart contract
     * @param tx_ Transaction to be executed
     */
    function exec(address safe, Tx calldata tx_) external;

    /**
     *
     * @param safe Address of a Safe smart contract wallet
     * @param tx_ Transaction to be executed
     */
    function getJobInfo(
        address safe,
        Tx calldata tx_
    ) external view returns (Job memory);
}
