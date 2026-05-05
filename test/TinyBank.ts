import hre from "hardhat";
import { expect } from "chai";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank multi manager", () => {
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  let signers: HardhatEthersSigner[];
  let managers: HardhatEthersSigner[];

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    managers = [signers[0], signers[1], signers[2]];

    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
    ]);

    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers.map((manager) => manager.address),
    ]);
  });

  it("should register at least 3 managers", async () => {
    expect(await tinyBankC.isManager(managers[0].address)).equal(true);
    expect(await tinyBankC.isManager(managers[1].address)).equal(true);
    expect(await tinyBankC.isManager(managers[2].address)).equal(true);
  });

  it("should revert when non-manager changes rewardPerBlock", async () => {
    const hacker = signers[3];
    const rewardToChange = hre.ethers.parseUnits("10000", 18);

    await expect(
      tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
    ).to.be.revertedWith("You are not a manager");
  });

  it("should revert when not all managers confirmed", async () => {
    const rewardToChange = hre.ethers.parseUnits("1", 18);

    await tinyBankC.connect(managers[0]).confirm();
    await tinyBankC.connect(managers[1]).confirm();

    await expect(
      tinyBankC.connect(managers[0]).setRewardPerBlock(rewardToChange),
    ).to.be.revertedWith("Not all confirmed yet");
  });

  it("should change rewardPerBlock when all managers confirmed", async () => {
    const rewardToChange = hre.ethers.parseUnits("1", 18);

    await tinyBankC.connect(managers[0]).confirm();
    await tinyBankC.connect(managers[1]).confirm();
    await tinyBankC.connect(managers[2]).confirm();
    await tinyBankC.connect(managers[0]).setRewardPerBlock(rewardToChange);

    expect(await tinyBankC.rewardPerBlock()).equal(rewardToChange);
    expect(await tinyBankC.confirmed(managers[0].address)).equal(false);
    expect(await tinyBankC.confirmed(managers[1].address)).equal(false);
    expect(await tinyBankC.confirmed(managers[2].address)).equal(false);
  });
});
