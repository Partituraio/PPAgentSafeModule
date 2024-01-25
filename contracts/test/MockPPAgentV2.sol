// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IPPAgentV2.sol";

contract MockPPAgentV2 {
    function execute(
        address jobAddress,
        bytes32 jobKey,
        bytes calldata execData
    ) external {
        (bool ok, bytes memory res) = jobAddress.call(
            bytes.concat(execData, jobKey)
        );
        if (!ok) revert("Transaction failed");
    }

    function getJob(
        bytes32 jobKey_
    )
        external
        pure
        returns (
            address owner,
            address pendingTransfer,
            uint256 jobLevelMinKeeperCvp,
            IPPAgentV2JobOwner.Job memory details,
            bytes memory preDefinedCalldata,
            IPPAgentV2JobOwner.Resolver memory resolver
        )
    {
        return (
            address(bytes20(jobKey_)),
            address(0),
            uint256(0),
            IPPAgentV2JobOwner.Job({
                config: 0,
                selector: bytes4(0),
                credits: 0,
                maxBaseFeeGwei: 0,
                rewardPct: 0,
                fixedReward: 0,
                calldataSource: 0,
                intervalSeconds: 0,
                lastExecutionAt: 0
            }),
            abi.encode(0),
            IPPAgentV2JobOwner.Resolver({
                resolverAddress: address(0),
                resolverCalldata: abi.encode(0)
            })
        );
    }
}
