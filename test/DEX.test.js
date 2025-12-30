const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);

    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  // ======================================================
  // Liquidity Management (8 tests)
  // ======================================================
  describe("Liquidity Management", function () {

    it("should allow initial liquidity provision", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("100"));
      expect(rB).to.equal(ethers.utils.parseEther("200"));
    });

    it("should mint LP tokens for first provider", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(await dex.liquidity(owner.address)).to.be.gt(0);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await tokenA.transfer(addr1.address, ethers.utils.parseEther("50"));
      await tokenB.transfer(addr1.address, ethers.utils.parseEther("100"));

      await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("50"));
      await tokenB.connect(addr1).approve(dex.address, ethers.utils.parseEther("100"));

      await dex.connect(addr1).addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("150"));
      expect(rB).to.equal(ethers.utils.parseEther("300"));
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await dex.addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );
      expect(await dex.getPrice()).to.equal(2);
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await dex.removeLiquidity(
        (await dex.liquidity(owner.address)).div(2)
      );
      expect(await dex.liquidity(owner.address)).to.be.gt(0);
    });

    it("should return correct amounts on liquidity removal", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await dex.removeLiquidity(
        (await dex.liquidity(owner.address)).div(2)
      );
      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("50"));
      expect(rB).to.equal(ethers.utils.parseEther("100"));
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, 0))
        .to.be.revertedWith("Zero amount");
    });

    it("should revert when removing more liquidity than owned", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await expect(
        dex.removeLiquidity((await dex.liquidity(owner.address)).add(1))
      ).to.be.revertedWith("Not enough liquidity");
    });
  });

  // ======================================================
  // Token Swaps (8 tests)
  // ======================================================
  describe("Token Swaps", function () {

    beforeEach(async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
    });

    it("should swap token A for token B", async function () {
      const before = await tokenB.balanceOf(owner.address);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const after = await tokenB.balanceOf(owner.address);
      expect(after).to.be.gt(before);
    });

    it("should swap token B for token A", async function () {
      const before = await tokenA.balanceOf(owner.address);
      await dex.swapBForA(ethers.utils.parseEther("20"));
      const after = await tokenA.balanceOf(owner.address);
      expect(after).to.be.gt(before);
    });

    it("should update reserves after swap", async function () {
      await dex.swapAForB(ethers.utils.parseEther("10"));
      expect((await dex.getReserves())[0])
        .to.equal(ethers.utils.parseEther("110"));
    });

    it("should revert on zero swap", async function () {
      await expect(dex.swapAForB(0))
        .to.be.revertedWith("Zero swap");
    });

    it("should calculate output using getAmountOut", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const [rA, rB] = await dex.getReserves();
      const expected = await dex.getAmountOut(amountIn, rA, rB);

      const before = await tokenB.balanceOf(owner.address);
      await dex.swapAForB(amountIn);
      const after = await tokenB.balanceOf(owner.address);

      expect(after.sub(before)).to.equal(expected);
    });

    it("should increase k after swap", async function () {
      const [a1, b1] = await dex.getReserves();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [a2, b2] = await dex.getReserves();
      expect(a2.mul(b2)).to.be.gt(a1.mul(b1));
    });

    it("should handle large swaps", async function () {
      const before = await tokenB.balanceOf(owner.address);
      await dex.swapAForB(ethers.utils.parseEther("50"));
      const after = await tokenB.balanceOf(owner.address);
      expect(after.sub(before)).to.be.lt(ethers.utils.parseEther("100"));
    });

    it("should handle multiple swaps", async function () {
      await dex.swapAForB(ethers.utils.parseEther("5"));
      await dex.swapAForB(ethers.utils.parseEther("5"));
      await dex.swapAForB(ethers.utils.parseEther("5"));
      expect((await dex.getReserves())[0])
        .to.equal(ethers.utils.parseEther("115"));
    });
  });

  // ======================================================
  // Price Calculations (3 tests)
  // ======================================================
  describe("Price Calculations", function () {

    it("should return correct price", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(await dex.getPrice()).to.equal(2);
    });

    it("should change price after swap", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await dex.swapAForB(ethers.utils.parseEther("10"));
      expect(await dex.getPrice()).to.be.lt(2);
    });

    it("should revert when no liquidity", async function () {
      await expect(dex.getPrice())
        .to.be.revertedWith("No liquidity");
    });
  });

  // ======================================================
  // Fee Distribution (2 tests)
  // ======================================================
  describe("Fee Distribution", function () {

    it("should reward LPs with fees", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      await dex.swapAForB(ethers.utils.parseEther("10"));
      await dex.swapAForB(ethers.utils.parseEther("10"));

      await dex.removeLiquidity(await dex.liquidity(owner.address));

      expect(await tokenA.balanceOf(owner.address))
        .to.be.gt(ethers.utils.parseEther("999900"));
    });

    it("should distribute fees proportionally", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await tokenA.transfer(addr1.address, ethers.utils.parseEther("50"));
      await tokenB.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("50"));
      await tokenB.connect(addr1).approve(dex.address, ethers.utils.parseEther("100"));

      await dex.connect(addr1).addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      await dex.swapAForB(ethers.utils.parseEther("30"));

      expect(await dex.liquidity(owner.address))
        .to.be.gt(await dex.liquidity(addr1.address));
    });
  });

  // ======================================================
  // Events (3 tests)
  // ======================================================
  describe("Events", function () {

    it("should emit LiquidityAdded", async function () {
      await expect(
        dex.addLiquidity(
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("20")
        )
      ).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20")
      );
      await expect(
        dex.removeLiquidity(await dex.liquidity(owner.address))
      ).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20")
      );
      await expect(
        dex.swapAForB(ethers.utils.parseEther("1"))
      ).to.emit(dex, "Swap");
    });
  });

  // ======================================================
  // Sanity Check (2 tests)
  // ======================================================
  describe("Sanity Check", function () {

    it("should store correct token addresses", async function () {
      expect(await dex.tokenA()).to.equal(tokenA.address);
      expect(await dex.tokenB()).to.equal(tokenB.address);
    });

    it("should have non-zero total liquidity after adding liquidity", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20")
      );
      expect(await dex.totalLiquidity()).to.be.gt(0);
    });
  });

});
