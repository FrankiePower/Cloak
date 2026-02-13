// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {CloakRouter} from "../src/CloakRouter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CloakRouter
        CloakRouter router = new CloakRouter();

        console.log("CloakRouter deployed at:", address(router));

        vm.stopBroadcast();
    }
}
