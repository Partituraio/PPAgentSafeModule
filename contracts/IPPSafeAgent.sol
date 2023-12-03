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

    error ExecutionReverted();
    error InactiveJob();
    error InvalidSender();
    error IntervalNotReached();

    /**
     *
     * @param safe Address of a Safe smart contract
     * @param tx_ Transaction to be executed
     */
    function exec(address safe, Tx calldata tx_) external;
}
