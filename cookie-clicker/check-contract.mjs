import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http()
});

async function run() {
  const address = '0xB8a942d85A42b926C23B7f33A255b8DF384b15c8';
  try {
    // Let's just try to call ERC721 name() and ERC1155 uri() to see what it is
    const name = await client.readContract({
      address,
      abi: [{ name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] }],
      functionName: 'name'
    });
    console.log('Contract Name:', name);
    // Try to see if it has ERC721 Drop claim
    console.log('It seems to be an ERC721.');
  } catch (err) {
    console.error('Not ERC721?', err.message);
  }
}
run();
