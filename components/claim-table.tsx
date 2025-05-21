"use client"

import type React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AirdropItem, ClaimableAirdropItem } from "@/types/airdrop"
import { DistributorInfo, TokenMetadata } from "@/types/metadata"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import { SolanaDistributorClient } from "@streamflow/distributor/solana"
import { ICluster } from "@streamflow/common"
import { clusterApiUrl } from "@solana/web3.js"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { useSnackbar } from "notistack"

const TableSkeleton = () => (
  <TableRow>
    {[...Array(7)].map((_, idx) => (
      <TableCell key={idx}>
        <Skeleton className="h-4 w-full" />
      </TableCell>
    ))}
  </TableRow>
)

export default function ClaimTable() {
  const router = useRouter()
  const { connected, publicKey, wallet } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [claimableAirdrops, setClaimableAirdrops] = useState<ClaimableAirdropItem[]>([])
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [tokenPrice, setTokenPrice] = useState<Record<string, number>>({})
  const [distributors, setDistributors] = useState<Record<string, DistributorInfo>>({})
  const [airdrops, setAirdrops] = useState<Record<string, AirdropItem>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [claiming, setClaiming] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/airdrops/claimable/${publicKey?.toBase58()}`)
        const { items } = await res.json()
        setClaimableAirdrops(items)
        await Promise.all([
          fetchMetadata(items),
          fetchDistributors(items),
          fetchAirdropDetails(items),
        ])
      } catch (err) {
        console.error("Failed to load claimable airdrops", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [publicKey])

  const fetchMetadata = async (airdrops: ClaimableAirdropItem[]) => {
    const metaMap: Record<string, TokenMetadata> = {}
    const priceMap: Record<string, number> = {}

    await Promise.all(
      airdrops.map(async ({ mint }) => {
        const metadata = await getTokenMetadata(mint)
        const priceRes = await fetch(`/api/price/${mint}`)
        const priceData = await priceRes.json()
        metaMap[mint] = metadata
        priceMap[mint] = priceData[mint]?.value
      })
    )

    setTokenMetadata(metaMap)
    setTokenPrice(priceMap)
  }

  const fetchDistributors = async (airdrops: ClaimableAirdropItem[]) => {
    const map: Record<string, DistributorInfo> = {}
    await Promise.all(
      airdrops.map(async ({ distributorAddress }) => {
        map[distributorAddress] = await getDistributor(distributorAddress)
      })
    )
    setDistributors(map)
  }

  const fetchAirdropDetails = async (airdrops: ClaimableAirdropItem[]) => {
    const map: Record<string, AirdropItem> = {}
    await Promise.all(
      airdrops.map(async ({ distributorAddress }) => {
        const res = await fetch(`/api/airdrops/${distributorAddress}`)
        map[distributorAddress] = await res.json()
      })
    )
    setAirdrops(map)
  }

  const handleClaim = async (e: React.MouseEvent, airdrop: ClaimableAirdropItem) => {
    e.stopPropagation()
    if (!wallet?.adapter || !publicKey) return

    setClaiming(prev => new Map(prev).set(airdrop.distributorAddress, true))
    try {
      const proofRes = await fetch(`/api/airdrops/${airdrop.distributorAddress}/claimants/${publicKey.toBase58()}`)
      const { proof } = await proofRes.json()

      const client = new SolanaDistributorClient({
        clusterUrl: clusterApiUrl("devnet"),
        cluster: ICluster.Devnet,
      })

      await client.claim(
        {
          id: airdrop.distributorAddress,
          amountUnlocked: airdrop.amountUnlocked,
          amountLocked: airdrop.amountLocked,
          proof,
        },
        {
          invoker: wallet.adapter as any,
        }
      )

      setClaimableAirdrops(prev =>
        prev.filter((item) => item.distributorAddress !== airdrop.distributorAddress)
      )
      enqueueSnackbar("Airdrop claimed successfully", { variant: "success" })
    } catch (err) {
      console.error("Error claiming airdrop:", err)
      enqueueSnackbar("Failed to claim airdrop", { variant: "error" })
    } finally {
      setClaiming(prev => new Map(prev).set(airdrop.distributorAddress, false))
    }
  }

  const renderRow = (airdrop: ClaimableAirdropItem) => {
    const metadata = tokenMetadata[airdrop.mint]
    const price = tokenPrice[airdrop.mint] || 1
    const distributor = distributors[airdrop.distributorAddress]
    const airdropInfo = airdrops[airdrop.distributorAddress]
    const decimals = metadata?.decimals || 9
    const symbol = metadata?.symbol || "?"
    const isInstant = distributor?.startTs === distributor?.endTs

    return (
      <TableRow
        key={airdrop.distributorAddress}
        onClick={(e) => handleRowClick(airdrop.distributorAddress, e)}
        className="cursor-pointer hover:bg-secondary/50"
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {metadata?.image ? (
              <Image src={metadata.image} alt={symbol} width={32} height={32} className="rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {symbol[0] || "?"}
              </div>
            )}
            <div>
              <div>{symbol}</div>
              <div className="text-xs text-muted-foreground">{airdrop.mint}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{(Number(airdrop.claimableValue) / price).toFixed(4)} {symbol}</TableCell>
        <TableCell>{(distributor?.maxTotalClaim || 0) / Math.pow(10, decimals)} {symbol}</TableCell>
        <TableCell>{airdropInfo?.name}</TableCell>
        <TableCell>
          <Badge variant={isInstant ? "default" : "secondary"}>{isInstant ? "Instant" : "Vested"}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <button
            onClick={(e) => handleClaim(e, airdrop)}
            className="text-primary hover:underline disabled:opacity-50"
            disabled={claiming.get(airdrop.distributorAddress)}
          >
            {claiming.get(airdrop.distributorAddress) ? "Claiming..." : "Claim"}
          </button>
        </TableCell>
      </TableRow>
    )
  }

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return
    router.push(`/airdrops/solana/devnet/${id}`)
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
          {isLoading
            ? [...Array(5)].map((_, i) => <TableSkeleton key={i} />)
            : claimableAirdrops.map(renderRow)}
        </TableBody>
      </Table>
    </div>
  )
}
