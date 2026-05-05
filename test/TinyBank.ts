import hre from "hardhat";
import { expect } from "chai";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("TinyBank", () => {
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  let signers: HardhatEthersSigner[];

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();

    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
    ]);

    tinyBankC = await hre.ethers.deployContract("TinyBank", [myTokenC]);
    await tinyBankC.addManager(signers[1].address);
    await tinyBankC.addManager(signers[2].address);
    await myTokenC.mint(
      hre.ethers.parseUnits((MINTING_AMOUNT - 1n).toString(), DECIMALS),
      signers[0].address,
    );
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);

      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT every blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits(
          (BLOCKS + MINTING_AMOUNT + 1n).toString(),
          DECIMALS,
        ),
      );
    });

    it("should register at least 3 managers", async () => {
      expect(await tinyBankC.isManager(signers[0].address)).equal(true);
      expect(await tinyBankC.isManager(signers[1].address)).equal(true);
      expect(await tinyBankC.isManager(signers[2].address)).equal(true);
    });

    it("Should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });

    it("Should revert when changing rewardPerBlock before all managers confirm", async () => {
      const rewardToChange = hre.ethers.parseUnits("1", DECIMALS);

      await tinyBankC.connect(signers[0]).confirm();
      await tinyBankC.connect(signers[1]).confirm();

      await expect(
        tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("Should change rewardPerBlock when all managers confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("1", DECIMALS);

      await tinyBankC.connect(signers[0]).confirm();
      await tinyBankC.connect(signers[1]).confirm();
      await tinyBankC.connect(signers[2]).confirm();
      await tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange);

      expect(await tinyBankC.rewardPerBlock()).equal(rewardToChange);
    });
  });
});
