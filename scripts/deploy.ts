import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("🚀 AIDCHAIN — Proof of Aid Deployment");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("==================================================");

  // 1. Deploy MockUSDC
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDCFactory.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`✅ MockUSDC deployed at: ${usdcAddress}`);

  await (await mockUSDC.mintWhole(deployer.address, 1_000_000)).wait();
  console.log("💰 Minted 1,000,000 MockUSDC to deployer");

  // 2. Deploy AidChainEscrow
  const EscrowFactory = await ethers.getContractFactory("AidChainEscrow");
  const escrow = await EscrowFactory.deploy(deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`✅ AidChainEscrow deployed at: ${escrowAddress}`);

  // 3. Create demo aid program
  if (network.name === "localhost" || network.name === "hardhat") {
    const now = Math.floor(Date.now() / 1000);
    const tx = await escrow.createAidProgram(
      deployer.address, // oracle = deployer for demo
      usdcAddress,
      ethers.parseUnits("10000", 6), // 10,000 USDC goal
      [
        ethers.parseUnits("2000", 6), // Procurement: food packages
        ethers.parseUnits("5000", 6), // Distribution: delivery to camps
        ethers.parseUnits("1000", 6), // Reporting: final impact report
      ],
      [now + 86400, now + 172800, now + 259200], // 1d, 2d, 3d deadlines
      [0, 1, 2] // Procurement, Distribution, Reporting
    );
    await tx.wait();
    console.log("✅ Demo aid program #1 created");
  }

  console.log("\n==================================================");
  console.log("📋 Copy these to your .env files:");
  console.log(`CONTRACT_ADDRESS=${escrowAddress}`);
  console.log(`MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log(`ORACLE_ADDRESS=${deployer.address}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
