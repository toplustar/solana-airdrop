"use client"

import type React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AirdropItem } from "@/types/airdrop"
import { DistributorInfo, TokenMetadata } from "@/types/metadata"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import Image from "next/image"

export default function AirdropTable() {
  const router = useRouter()
  const { connected, publicKey } = useWallet()

  const [airdrops, setAirdrops] = useState<AirdropItem[]>([])
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [distributors, setDistributors] = useState<Record<string, DistributorInfo>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAirdrops = async () => {
      try {
        const response = await fetch("/api/airdrops/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actor: publicKey?.toBase58(),
            limit: 50,
            offset: 0,
            filters: {
              include: {
                isOnChain: true,
                sender: [publicKey?.toBase58()],
              },
            },
            sorters: [{ by: "id", order: "desc" }],
          }),
        })

        const data = await response.json()
        setAirdrops(data.items || [])
        await fetchAirdropDetails(data.items || [])
      } catch (error) {
        console.error("Error fetching airdrops:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAirdrops()
  }, [publicKey])

  const fetchAirdropDetails = async (items: AirdropItem[]) => {
    const metadataMap: Record<string, TokenMetadata> = {}
    const distributorMap: Record<string, DistributorInfo> = {}

    await Promise.all(
      items.map(async (airdrop) => {
        try {
          const [metadata, distributor] = await Promise.all([
            getTokenMetadata(airdrop.mint),
            getDistributor(airdrop.address),
          ])
          metadataMap[airdrop.mint] = metadata
          distributorMap[airdrop.address] = distributor
        } catch (error) {
          console.error(`Error fetching details for ${airdrop.address}:`, error)
        }
      })
    )

    setTokenMetadata(metadataMap)
    setDistributors(distributorMap)
  }

  const handleRowClick = (airdropId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return
    router.push(`/airdrops/solana/devnet/${airdropId}`)
  }

  const renderBadge = (info: DistributorInfo | undefined) => {
    if (!info) return <div className="h-4 w-16 bg-muted animate-pulse rounded" />
    const isInstant = info.startTs === info.endTs
    return <Badge variant={isInstant ? "default" : "secondary"}>{isInstant ? "Instant" : "Vested"}</Badge>
  }

  const renderTableRows = () =>
    airdrops.map((airdrop) => {
      const metadata = tokenMetadata[airdrop.mint]
      const dist = distributors[airdrop.address]
      const tokenSymbol = metadata?.symbol || "?"
      const decimals = metadata?.decimals || 9

      return (
        <TableRow
          key={airdrop.address}
          onClick={(e) => handleRowClick(airdrop.address, e)}
          className="cursor-pointer hover:bg-secondary/50"
        >
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              {metadata?.image ? (
                <Image
                  src={metadata.image}
                  alt={`${tokenSymbol} icon`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-8 h-8"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {tokenSymbol[0]}
                </div>
              )}
              <div>
                <div>{tokenSymbol}</div>
                <div className="text-xs text-muted-foreground">{airdrop.mint}</div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            {dist ? `${dist.numNodesClaimed || 0}/${airdrop.maxNumNodes}` : "Loading..."}
          </TableCell>
          <TableCell>
            {dist && metadata
              ? `${(dist.totalAmountClaimed / Math.pow(10, decimals)).toFixed(4)} / ${(Number(airdrop.maxTotalClaim) / Math.pow(10, decimals)).toFixed(4)} ${tokenSymbol}`
              : "Loading..."}
          </TableCell>
          <TableCell>{airdrop.name}</TableCell>
          <TableCell>{renderBadge(dist)}</TableCell>
        </TableRow>
      )
    })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Recipients Claimed / Total</TableHead>
            <TableHead>Amount Claimed / Total</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : renderTableRows()}
        </TableBody>
      </Table>
    </div>
  )
}