#!/bin/bash
source .env

forge create \
  --rpc-url https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox \
  --private-key $PRIVATE_KEY \
  --legacy \
  src/AgentMarketplace.sol:AgentMarketplace
