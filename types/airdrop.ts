export interface AirdropFilters {
  include: {
    isOnChain: boolean
    isActive: boolean
  }
}

export interface AirdropSorter {
  by: string
  order: 'asc' | 'desc'
}

export interface AirdropSearchParams {
  actor: string
  limit: number
  offset: number
  filters: AirdropFilters
  sorters: AirdropSorter[]
}

export interface ClaimableAirdropItem {
  chain: string
  distributorAddress: string
  address: string
  amountUnlocked: string
  amountLocked: string
  amountClaimed: string
  mint: string
  claimableValue: string
}

export interface AirdropItem {
  chain: string
  mint: string
  version: number
  address: string
  sender: string
  name: string
  maxNumNodes: string
  maxTotalClaim: string
  totalAmountUnlocked: string
  totalAmountLocked: string
  isActive: boolean
  isOnChain: boolean
  isVerified: boolean
  clawbackDt?: string | null
  isAligned?: boolean
  merkleRoot?: number[]
}

export interface AirdropResponse {
  limit: number
  offset: number
  items: AirdropItem[]
} 