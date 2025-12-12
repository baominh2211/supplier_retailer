const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy B2BEscrow
  console.log("\n📜 Deploying B2BEscrow...");
  const B2BEscrow = await hre.ethers.getContractFactory("B2BEscrow");
  const escrow = await B2BEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ B2BEscrow deployed to:", escrowAddress);
  
  // Deploy B2BReputationToken
  console.log("\n🏆 Deploying B2BReputationToken...");
  const B2BReputationToken = await hre.ethers.getContractFactory("B2BReputationToken");
  const reputation = await B2BReputationToken.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("✅ B2BReputationToken deployed to:", reputationAddress);
  
  // Deploy ProductCertificateNFT
  console.log("\n🎖️ Deploying ProductCertificateNFT...");
  const ProductCertificateNFT = await hre.ethers.getContractFactory("ProductCertificateNFT");
  const nft = await ProductCertificateNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ ProductCertificateNFT deployed to:", nftAddress);
  
  // Set up permissions
  console.log("\n⚙️ Setting up permissions...");
  
  // Authorize escrow contract to mint reputation tokens
  await reputation.authorizeMinter(escrowAddress);
  console.log("✅ Escrow authorized to mint reputation tokens");
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("");
  console.log("Contract Addresses:");
  console.log(`  B2BEscrow:            ${escrowAddress}`);
  console.log(`  B2BReputationToken:   ${reputationAddress}`);
  console.log(`  ProductCertificateNFT: ${nftAddress}`);
  console.log("=".repeat(60));
  
  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      B2BEscrow: escrowAddress,
      B2BReputationToken: reputationAddress,
      ProductCertificateNFT: nftAddress,
    },
    deployedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(addresses, null, 2)
  );
  console.log(`\n💾 Addresses saved to ./deployments/${hre.network.name}.json`);
  
  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 To verify contracts on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${escrowAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${reputationAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${nftAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
