# DEX AMM Project

## Overview
This project implements a simplified **Decentralized Exchange (DEX)** based on the **Automated Market Maker (AMM)** model, inspired by Uniswap V2.  
The DEX enables users to trade two ERC-20 tokens directly on-chain without relying on order books or centralized intermediaries.

Liquidity is managed through a pool that follows the **constant product formula (x × y = k)**, allowing permissionless token swaps while automatically determining prices. Liquidity providers earn trading fees proportional to their contribution to the pool.

---

## Features
- Initial and subsequent liquidity provision
- Liquidity removal with proportional share calculation
- Token swaps using constant product formula (x × y = k)
- 0.3% trading fee for liquidity providers
- LP token minting and burning
- Fee accumulation directly in the liquidity pool
- Fully tested with 25+ test cases
- Dockerized environment for consistent evaluation

---

## Architecture
The project consists of two main smart contracts:

### 1. DEX.sol
- Core AMM logic
- Manages liquidity pools, reserves, swaps, and fees
- Tracks liquidity provider ownership using internal LP accounting
- Emits events for liquidity additions, removals, and swaps
- Uses OpenZeppelin libraries for security (`SafeERC20`, `ReentrancyGuard`)

### 2. MockERC20.sol
- Simple ERC-20 token used for testing
- Allows minting tokens for test accounts

### Design Decisions
- **Integrated LP logic** instead of a separate LP token contract for simplicity
- **ReentrancyGuard** used to prevent reentrancy attacks
- **SafeERC20** ensures safe token transfers
- Reserves tracked internally instead of relying on token balances
- Fee stays inside the pool, increasing LP value over time

---

## Mathematical Implementation

### Constant Product Formula
The AMM follows the invariant:

```

x × y = k

```

Where:
- `x` = reserve of Token A  
- `y` = reserve of Token B  
- `k` = constant value

During a swap:
- One token is added to the pool
- The other token is removed
- The product of reserves never decreases
- Due to fees, `k` slightly increases over time

This mechanism automatically adjusts prices based on supply and demand.

---

### Fee Calculation
A **0.3% trading fee** is applied to every swap.

Formula used:
```

amountInWithFee = amountIn × 997
numerator = amountInWithFee × reserveOut
denominator = (reserveIn × 1000) + amountInWithFee
amountOut = numerator / denominator

```

- Only **99.7%** of the input amount is used for the swap
- **0.3% fee remains in the pool**
- Fees increase the total pool value, benefiting liquidity providers

---

### LP Token Minting

#### Initial Liquidity (First Provider)
```

liquidityMinted = sqrt(amountA × amountB)

```
- First provider sets the initial price
- LP tokens represent ownership of the pool

#### Subsequent Liquidity Providers
Liquidity must maintain the existing price ratio:
```

liquidityMinted = (amountA × totalLiquidity) / reserveA

```

#### Liquidity Removal
Liquidity providers receive tokens proportional to their share:
```

amountA = (liquidityBurned × reserveA) / totalLiquidity
amountB = (liquidityBurned × reserveB) / totalLiquidity

````

---

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Git installed

---

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Swetha-svvv/dex-amm.git
cd dex-amm
````

2. Start Docker environment:

```bash
docker-compose up -d
```

3. Compile contracts:

```bash
docker-compose exec app npm run compile
```

4. Run tests:

```bash
docker-compose exec app npm test
```

5. Check coverage:

```bash
docker-compose exec app npm run coverage
```

6. Stop Docker:

```bash
docker-compose down
```

---

## Running Tests Locally (without Docker)

```bash
npm install
npm run compile
npm test
```

---

## Contract Addresses

This project is deployed locally on the Hardhat network during development.
If deployed to a public testnet, contract addresses and block explorer links should be listed here.

---

## Known Limitations

* Supports only a single trading pair
* No slippage protection (minimum output parameter)
* No deadline parameter for time-bound swaps
* Not optimized for gas usage beyond basic Solidity optimizations
* Direct token transfers to the contract are not tracked as liquidity additions

---

## Security Considerations

* Uses `ReentrancyGuard` to prevent reentrancy attacks
* Uses `SafeERC20` to handle token transfers safely
* Validates all inputs (non-zero amounts, sufficient liquidity)
* Prevents liquidity withdrawal beyond ownership
* Relies on Solidity 0.8+ built-in overflow and underflow checks
* Reserves updated explicitly after every state-changing operation

---

## Conclusion

This project demonstrates a complete implementation of a Uniswap-style AMM-based DEX, including liquidity management, swap mechanics, fee distribution, and extensive testing. The system is fully dockerized, well-tested, and designed with security best practices in mind.

````
