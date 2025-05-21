"use client"

import type React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AirdropItem, ClaimableAirdropItem } from "@/types/airdrop"
import { DistributorInfo } from "@/types/metadata"
import { TokenMetadata } from "@/types/metadata"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import { SolanaDistributorClient } from "@streamflow/distributor/solana"
import { ICluster } from "@streamflow/common"
import { clusterApiUrl } from "@solana/web3.js"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { useSnackbar } from "notistack"
const TableSkeleton = () => {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
    </TableRow>
  )
}

export default function ClaimTable() {
  const router = useRouter()
  const { connected, publicKey, wallet } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [claimableAirdrops, setClaimableAirdrops] = useState<ClaimableAirdropItem[]>([])
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [tokenPrice, setTokenPrice] = useState<Record<string, number>>({})
  const [distributor, setDistributor] = useState<Record<string, DistributorInfo>>({})
  const [airdropData, setAirdropData] = useState<Record<string, AirdropItem>>({})
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [claimingStates, setClaimingStates] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    const fetchClaimableAirdrops = async () => {
      const response = await fetch(`/api/airdrops/claimable/${publicKey?.toBase58()}`)
      const data = await response.json()
      setClaimableAirdrops(data.items)
    }
    fetchClaimableAirdrops()
  }, [])
  
  useEffect(() => {
    if (claimableAirdrops) {
      setIsDataLoading(true)
      const loadAllData = async () => {
        try {
          await Promise.all([
            fetchAirdropData(),
            fetchAllMetadata(),
            fetchDistributor()
          ])
        } catch (error) {
          console.error("Error loading data:", error)
        } finally {
          setIsDataLoading(false)
        }
      }
      loadAllData()
    }
  }, [claimableAirdrops])

  const fetchAirdropData = async () => {
    const airdropPromises = claimableAirdrops?.map(async (airdrop) => {
      try {
        const response = await fetch(`/api/airdrops/${airdrop.distributorAddress}`)
        const data = await response.json()
        setAirdropData(prev => ({
          ...prev,
          [airdrop.distributorAddress]: data
        }))
      } catch (error) {
        console.error(`Error fetching airdrop data for ${airdrop.distributorAddress}:`, error)
        enqueueSnackbar(`Error fetching airdrop data for ${airdrop.distributorAddress}:`, { variant: "error" })
      }
    })
    await Promise.all(airdropPromises || [])
  }

  const fetchAllMetadata = async () => {
    const metadataPromises = claimableAirdrops?.map(async (airdrop) => {
      try {
        const metadata = await getTokenMetadata(airdrop.mint)
        const price = await fetch(`/api/price/${airdrop.mint}`)
        const priceData = await price.json()
        setTokenPrice(prev => ({
          ...prev,
          [airdrop.mint]: priceData[airdrop.mint]?.value
        }))
        setTokenMetadata(prev => ({
          ...prev,
          [airdrop.mint]: metadata
        }))
      } catch (error) {
        console.error(`Error fetching metadata for ${airdrop.mint}:`, error)

      }
    })
    await Promise.all(metadataPromises || [])
  }

  const fetchDistributor = async () => {
    const distributorPromises = claimableAirdrops?.map(async (airdrop) => {
      try {
        const distributor = await getDistributor(airdrop.distributorAddress)
        setDistributor(prev => ({
          ...prev,
          [airdrop.distributorAddress]: distributor
        }))
      } catch (error) {
        console.error(`Error fetching distributor for ${airdrop.address}:`, error)
      }
    })
    await Promise.all(distributorPromises || [])
  }

  const handleRowClick = (airdropId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) {
      return
    }
    router.push(`/airdrops/solana/devnet/${airdropId}`)
  }


  const handleClaim = async (e: React.MouseEvent, claimableAirdrop: ClaimableAirdropItem) => {
    e.stopPropagation()
    if (!wallet?.adapter || !publicKey) return

    setClaimingStates(prev => new Map(prev).set(claimableAirdrop.distributorAddress, true))

    try {
      const proofResponse = await fetch(`/api/airdrops/${claimableAirdrop.distributorAddress}/claimants/${publicKey.toBase58()}`)
      const rest = await proofResponse.json()

      const client = new SolanaDistributorClient({
        clusterUrl: clusterApiUrl("devnet"),
        cluster: ICluster.Devnet,
      })

      const response = await client.claim(
        {
          id: claimableAirdrop.distributorAddress,
          amountUnlocked: claimableAirdrop.amountUnlocked,
          amountLocked: claimableAirdrop.amountLocked,
          proof: rest.proof,
        },
        {
          invoker: wallet.adapter as any,
        }
      )
      console.log("🔍 response:", response);
     
      setClaimableAirdrops(prev =>
        prev.filter(item => item.distributorAddress !== claimableAirdrop.distributorAddress)
      )
      enqueueSnackbar("Airdrop claimed successfully", { variant: "success" })
    } catch (error) {
      console.error("Error claiming airdrop:", error)
    } finally {
      setClaimingStates(prev => new Map(prev).set(claimableAirdrop.distributorAddress, false))
    }
  }

  if (isDataLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Claimable Now</TableHead>
              <TableHead>Total Allocation</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableSkeleton key={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Claimable Now</TableHead>
            <TableHead>Total Allocation</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claimableAirdrops?.map((claimableAirdrop, index) => (
            <TableRow
              key={index}
              onClick={(e) => handleRowClick(claimableAirdrop.distributorAddress, e)}
              className="cursor-pointer hover:bg-secondary/50"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {tokenMetadata[claimableAirdrop.mint]?.image ? (
                      <Image
                        src={tokenMetadata[claimableAirdrop.mint].image as string}
                        alt={`${tokenMetadata[claimableAirdrop.mint]?.symbol || 'Token'} icon`}
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        ?
                      </div>
                    )}
                  </div>
                  <div>
                    <div>{tokenMetadata[claimableAirdrop.mint]?.symbol}</div>
                    <div className="text-xs text-muted-foreground">{claimableAirdrop.mint}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell> {tokenPrice[claimableAirdrop.mint] ? Number(claimableAirdrop.claimableValue) / tokenPrice[claimableAirdrop.mint] : claimableAirdrop.claimableValue} {tokenMetadata[claimableAirdrop.mint]?.symbol}</TableCell>
              <TableCell>
                {distributor[claimableAirdrop.distributorAddress]?.maxTotalClaim / Math.pow(10, tokenMetadata[claimableAirdrop.mint]?.decimals || 9)} {tokenMetadata[claimableAirdrop.mint]?.symbol}
              </TableCell>
              <TableCell>{airdropData[claimableAirdrop.distributorAddress]?.name}</TableCell>
              <TableCell>
                <Badge variant={distributor[claimableAirdrop.distributorAddress]?.startTs === distributor[claimableAirdrop.distributorAddress]?.endTs ? "default" : "secondary"}>{distributor[claimableAirdrop.distributorAddress]?.startTs === distributor[claimableAirdrop.distributorAddress]?.endTs ? "Instant" : "Vested"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={(e) => handleClaim(e, claimableAirdrop)}
                  className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={claimingStates.get(claimableAirdrop.distributorAddress)}
                >
                  {claimingStates.get(claimableAirdrop.distributorAddress) ? "Claiming..." : "Claim"}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

