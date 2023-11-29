// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IPPAgentV2JobOwner {
    struct RegisterJobParams {
        address jobAddress;
        bytes4 jobSelector;
        bool useJobOwnerCredits;
        bool assertResolverSelector;
        uint16 maxBaseFeeGwei;
        uint16 rewardPct;
        uint32 fixedReward;
        uint256 jobMinCvp;
        uint8 calldataSource;
        uint24 intervalSeconds;
    }

    struct Resolver {
        address resolverAddress;
        bytes resolverCalldata;
    }

    function registerJob(
        RegisterJobParams calldata params_,
        Resolver calldata resolver_,
        bytes calldata preDefinedCalldata_
    ) external payable returns (bytes32 jobKey, uint256 jobId);
}
