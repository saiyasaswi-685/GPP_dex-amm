# dex-amm

## Overview
This project implements a simplified Decentralized Exchange (DEX) using an Automated Market Maker (AMM) model similar to Uniswap V2. It allows users to add and remove liquidity, swap between two ERC-20 tokens using the constant product formula, and earn trading fees as liquidity providers. The implementation strictly follows Partnr’s specifications and evaluation criteria.

## Features
- Initial and subsequent liquidity provision  
- Liquidity removal with proportional share calculation  
- Token swaps using constant product formula (x * y = k)  
- 0.3% trading fee for liquidity providers  
- LP token minting and burning  
- Event emission for liquidity and swaps  
- Fully Dockerized setup  

## Architecture
The project contains two main smart contracts:
- **DEX.sol**: Core AMM logic including reserve tracking, liquidity management, swaps, fee calculation, and event emission.
- **MockERC20.sol**: Simple ERC-20 token used for testing.

Hardhat is used for compilation, testing, and deployment. Docker is used to ensure a consistent and reproducible evaluation environment.

## Mathematical Implementation

### Constant Product Formula
The AMM maintains the invariant:
x * y = k

Where:
- x = reserve of token A  
- y = reserve of token B  

After each swap, reserves are updated so that k never decreases. Because the trading fee remains in the pool, k slightly increases over time.

### Fee Calculation (0.3%)
For every swap, a 0.3% fee is applied:
amountInWithFee = amountIn * 997  
numerator = amountInWithFee * reserveOut  
denominator = (reserveIn * 1000) + amountInWithFee  
amountOut = numerator / denominator  

The deducted fee stays in the pool and is distributed proportionally to liquidity providers.

### LP Token Minting
Initial Liquidity Provider:  
liquidityMinted = sqrt(amountA * amountB)

Subsequent Liquidity Providers:  
liquidityMinted = (amountA * totalLiquidity) / reserveA

### Liquidity Removal
amountA = (liquidityBurned * reserveA) / totalLiquidity  
amountB = (liquidityBurned * reserveB) / totalLiquidity  

## Setup Instructions

### Prerequisites
- Docker and Docker Compose  
- Git  

### Installation Using Docker
git clone <your-repo-url>  
cd dex-amm  
docker-compose up -d  
docker-compose exec app npm run compile  
docker-compose exec app npm test  
docker-compose exec app npm run coverage  
docker-compose down  

## Running Tests Locally (Without Docker)
npm install  
npm run compile  
npm test  

## Deployment
Deploy the contracts locally using Hardhat:
npx hardhat run scripts/deploy.js  

The deployed contract addresses will be printed in the terminal.

## Known Limitations
- Supports only a single trading pair  
- No slippage protection parameters  
- No deadline parameter for transactions  

## Security Considerations
- Solidity ^0.8.x overflow and underflow protection  
- Input validation for zero values and insufficient liquidity  
- Fees applied before swap calculations  
- Explicit reserve tracking instead of relying on balances  
- Events emitted for all critical state changes  
