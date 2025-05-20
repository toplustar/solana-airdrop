export interface TokenMetadata {
    symbol: string
    name: string
    decimals: number
    image?: string | null
  }

  export interface DistributorInfo {
    numNodesClaimed: number
    totalAmountClaimed: number
    startTs: number
    endTs: number
    maxTotalClaim: number
    root: number[] | undefined
  }