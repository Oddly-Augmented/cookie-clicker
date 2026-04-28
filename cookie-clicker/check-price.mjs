import { createThirdwebClient, getContract, encode } from "thirdweb";
import { getActiveClaimCondition } from "thirdweb/extensions/erc1155";
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
  const condition = await getActiveClaimCondition({ contract, tokenId: 0n });
  console.log("Price per token:", condition.pricePerToken);
  console.log("Currency:", condition.currency);
}
run();
