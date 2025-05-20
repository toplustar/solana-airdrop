import { Connection, clusterApiUrl, PublicKey,type GetVersionedTransactionConfig } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { getMint } from '@solana/spl-token';


export async function getTokenAccounts(address: string) {
  const connection = new Connection(clusterApiUrl('devnet'));

  try {
    const owner = new PublicKey(address);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    return tokenAccounts.value.map((accountInfo) => {
      const info = accountInfo.account.data.parsed.info;
      return {
        tokenAccount: accountInfo.pubkey.toBase58(),
        mint: info.mint,
        balance: info.tokenAmount.uiAmount,
        decimals: info.tokenAmount.decimals
      };
    });

  } catch (err) {
    console.error("Failed to get token accounts:", err);
    return [];
  }
}

export async function getRecentClaimedRecipients(address: string) {
  const connection = new Connection(clusterApiUrl("devnet"));
  const claimedRecipients = new Set<string>();
  const wallet = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(wallet);
  console.log(signatures)

  let config: GetVersionedTransactionConfig = {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0,
  };
  for (const signature of [...signatures].reverse()) {
    const tx = await connection.getParsedTransaction(signature.signature, config);
    console.log(tx, "tx")
    if (!tx) {
      console.log("Transaction not found");
      continue;
    }
    const preBalances = tx.meta?.preTokenBalances || [];
    const postBalances = tx.meta?.postTokenBalances || [];

    for (let i = 0; i < postBalances.length; i++) {
      const post = postBalances[i];
      const pre = preBalances.find((p) => p.accountIndex === post.accountIndex);

      const owner = post.owner || "";
      const mint = post.mint;
      const preAmount = pre?.uiTokenAmount?.uiAmount || 0;
      const postAmount = post.uiTokenAmount?.uiAmount || 0;
      const change = postAmount - preAmount;

      if (change > 0 && owner !== address) {
        claimedRecipients.add(owner);
      }
      
    } 
  }
  return Array.from(claimedRecipients);
}



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
    console.log("🔍 Mint Info:", mintInfo);
    decimals = mintInfo.decimals;
  } catch (err) {
    console.error("Error fetching mint info:", err);
  }

  try {
    const metadata = await metaplex.nfts().findByMint({ mintAddress });
    name = metadata.name || "";
    symbol = metadata.symbol || "";
    image = metadata.json?.image || "";
    
    
    if (mintAddressString === "So11111111111111111111111111111111111111112") {
      name = "Wrapped SOL";
      symbol = "SOL";
      image = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
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

// export async function getTokenMetadata(mintAddress: string) {
//     const url = `https://devnet.helius-rpc.com/?api-key=d1bd9b2a-f0cc-4bbe-a2be-024d04c44981`;
  
//     const body = {
//       jsonrpc: "2.0",
//       id: "helius",
//       method: "getAsset",
//       params: {
//         id: mintAddress
//       }
//     };
  
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(body)
//     });
  
//     const result = await response.json();
  
//     if (!result?.result) {
//       throw new Error("Asset not found.");
//     }
  
//     const asset = result.result;
    
//       console.log("✅ Token Info via Helius:");
//       console.log("Name:", asset.content?.metadata?.name ?? "N/A");
//       console.log("Symbol:", asset.content?.metadata?.symbol ?? "N/A");
//       console.log("Image URL:", asset.content?.links?.image ?? "N/A");
//       console.log("Decimals:", asset.token_info?.decimals ?? "N/A");

//     return {
//         decimals: asset.token_info?.decimals ?? 9,
//         name: asset.content?.metadata?.name ?? "unknown",
//         symbol: asset.content?.metadata?.symbol ?? "unknown",
//         image: asset.content?.links?.image ?? "",
//     };
//   }
  
