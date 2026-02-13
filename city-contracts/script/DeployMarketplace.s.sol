// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AgentMarketplace} from "../src/AgentMarketplace.sol";

contract DeployMarketplaceScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        AgentMarketplace marketplace = new AgentMarketplace();

        console.log("AgentMarketplace deployed at:", address(marketplace));

        vm.stopBroadcast();
    }
}
