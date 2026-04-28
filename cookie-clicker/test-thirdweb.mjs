import { createThirdwebClient, getContract, encode } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc1155";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "24a76854b807bca33c794a450e4a69d7",
});

const contract = getContract({
  client,
  chain: defineChain(8453),
  address: "0xB8a942d85A42b926C23B7f33A255b8DF384b15c8",
});

async function run() {
  try {
    const tx = claimTo({
      contract,
      to: "0x75A5E92a54336141f7a4d3E87eebF57E0Cf4239D", // dummy
      tokenId: 0n,
      quantity: 1n,
    });
    
    const data = await encode(tx);
    console.log("Encoded Data:", data);
    
    // Check if tx has value
    console.log("Tx Value helper:", tx.value);
    
    let value = 0n;
    if (typeof tx.value === 'function') {
      value = await tx.value();
    } else if (tx.value !== undefined) {
      value = await tx.value;
    }
    console.log("Value evaluated:", value);
  } catch (err) {
    console.error("Error generating tx:", err);
  }
}
run();
