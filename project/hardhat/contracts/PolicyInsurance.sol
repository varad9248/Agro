
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PolicyInsurance {
    struct Policy {
        uint256 id;
        address farmer;
        string crop;
        uint256 premium;
        bool active;
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    event PolicyBought(uint256 policyId, address farmer, string crop, uint256 premium);

    function buyPolicy(string memory _crop, uint256 _premium) public returns (uint256) {
        policyCount += 1;
        policies[policyCount] = Policy(policyCount, msg.sender, _crop, _premium, true);
        emit PolicyBought(policyCount, msg.sender, _crop, _premium);
        return policyCount;
    }
}
