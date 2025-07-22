async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const PolicyInsurance = await ethers.getContractFactory("PolicyInsurance");

  // Deploy the contract
  const contract = await PolicyInsurance.deploy();

  // ✔️ Wait for it to complete deployment
  await contract.waitForDeployment();

  // 🔄 Now get the deployed address properly
  console.log("PolicyInsurance contract deployed at:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment error:", err);
    process.exit(1);
  });
