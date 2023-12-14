// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface ISafe {
    enum Operation {
        Call,
        DelegateCall
    }

    /// @dev Allows a Module to execute a Safe transaction without any further confirmations and return data
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool success, bytes memory returnData);
}
