import { Connection, clusterApiUrl, PublicKey, type GetVersionedTransactionConfig } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { getMint } from '@solana/spl-token';

export async function getTokenMetadata(mintAddressString: string) {
  const mintAddress = new PublicKey(mintAddressString);
  const connection = new Connection(clusterApiUrl("devnet"));
  const metaplex = new Metaplex(connection);

  let decimals = 9;
  let name = "unknown";
  let symbol = "unknown";
  let image = "";

  try {
    const mintInfo = await getMint(connection, mintAddress);
    decimals = mintInfo.decimals;
  } catch (err) {
    console.error("Error fetching mint info:", err);
  }

  try {
    const metadata = await metaplex.nfts().findByMint({ mintAddress });
    name = metadata.name || "";
    symbol = metadata.symbol || "";
    
    // Try to get image from metadata.json first
    if (metadata.json?.image) {
      image = metadata.json.image;
    } else if (metadata.uri) {
      // If no image in metadata.json, try to fetch from URI
      try {
        const response = await fetch(metadata.uri);
        const jsonData = await response.json();
        image = jsonData.image || "";
      } catch (err) {
        console.error("Error fetching metadata from URI:", err);
      }
    }


    if (mintAddressString === "So11111111111111111111111111111111111111112") {
      name = "Wrapped SOL";
      symbol = "SOL";
      image = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
    }


    if (image) {
      try {
        const response = await fetch(image, { method: 'HEAD' });
        if (!response.ok) {
          image = ""; 
        }
      } catch (err) {
        console.error("Error validating image URL:", err);
        image = ""; 
      }
    }
  } catch (err) {
    console.error("Error fetching metadata:", err);
  }

  return {
    decimals,
    name,
    symbol,
    image,
  };
}


