import { clusterApiUrl } from "@solana/web3.js"
import { SolanaDistributorClient } from "@streamflow/distributor/solana";
import { ICluster } from "@streamflow/common";

const client = new SolanaDistributorClient({
  clusterUrl: clusterApiUrl("devnet"),
  cluster: ICluster.Devnet,
});

export async function searchDistributeStream( address: string) {

  const disributors = await client.searchDistributors({ admin: address });
  console.log("🔹 disributors:", disributors);
}



export async function getDistributor(id: string) {
  const distributors = await client.getDistributors({ ids: [id] });
  const distributor = distributors[0];
  console.log("🔹 distributor:", distributor);
  return {
    numNodesClaimed: Number(distributor?.numNodesClaimed),
    totalAmountClaimed: Number(distributor?.totalAmountClaimed),
    startTs: Number(distributor?.startTs),
    endTs: Number(distributor?.endTs),
    maxTotalClaim: Number(distributor?.maxTotalClaim),
    root: distributor?.root,
  }
}

export async function getClaims(recipient: string, id: string) {
  const claims = await client.getClaims([{
    id: id,
    recipient: recipient,
  }]);
  console.log("🔹 claims:", claims);
  return claims;
}

