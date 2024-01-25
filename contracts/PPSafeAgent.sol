// SPDX-License-Identifier: UNLICENSED

import "./interfaces/ISafe.sol";
import {IPPAgentV2JobOwner} from "./interfaces/IPPAgentV2.sol";
import {IPPAgentSafeModule} from "./interfaces/IPPSafeAgent.sol";

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

    /**
     *
     * @dev Only the PPAgent contract can execute transactions
     */
    modifier onlyAgent() {
        if (msg.sender != AgentContract) revert InvalidSender();
        _;
    }

    /**
     *
     * @dev Only owned by a safe wallet jobs can be executed on the safe wallet
     */
    modifier onlyOnwedJob(address wallet) {
        bytes32 jobKey = _getJobKey();
        (address jobOwner, , , , , ) = IPPAgentV2JobOwner(AgentContract).getJob(
            jobKey
        );
        if (wallet != jobOwner) revert InvalidJobOwner();
        _;
    }

    /**
     *
     * @param safe Address of a Safe smart contract
     * @param tx_ Transaction to be executed
     */
    function exec(
        address safe,
        Tx calldata tx_
    ) external onlyAgent onlyOnwedJob(safe) {
        (bool success, ) = ISafe(safe).execTransactionFromModuleReturnData(
            tx_.to,
            tx_.value,
            tx_.data,
            tx_.operation
        );

        if (!success) revert ExecutionReverted();
    }

    /**
     * @dev Returns last 32 bytes of calldata
     * @dev The last 32 bytes of the calldata is the jobKey
     */
    function _getJobKey() private pure returns (bytes32 jobKey) {
        assembly {
            jobKey := calldataload(sub(calldatasize(), 32))
        }
    }
}
