"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { getTokenMetadata } from "../lib/token-utils"
import Image from "next/image"
import { getDistributor } from "../lib/streamflow-client"
import { TokenMetadata, DistributorInfo } from "@/types/metadata"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { AirdropItem } from "@/types/airdrop"

const pageSize = 10 

export default function UnconnectedState() {
  const router = useRouter()
  const { connected } = useWallet()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [airdrops, setAirdrops] = useState<AirdropItem[]>([])
  const [totalAirdrops, setTotalAirdrops] = useState(0)
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [distributor, setDistributor] = useState<Record<string, DistributorInfo>>({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!connected) {
      const fetchAirdrops = async () => {
        const response = await fetch('/api/airdrops/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor: "",
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            filters: {
              include: { isOnChain: true, isActive: true }
            },
            sorters: [{ by: "id", order: "desc" }]
          })
        })
        const data = await response.json()
        setAirdrops(data.items)
        setTotalAirdrops(data.total)
      }
      fetchAirdrops()
    }
  }, [connected, currentPage])

  useEffect(() => {
    if (airdrops?.length > 0) {
      const fetchData = async () => {
        setIsDataLoading(true)
        try {
          const metadataMap: Record<string, TokenMetadata> = {}
          const distributorMap: Record<string, DistributorInfo> = {}

          await Promise.all(airdrops.map(async (airdrop) => {
            const [metadata, distributorData] = await Promise.all([
              getTokenMetadata(airdrop.mint),
              getDistributor(airdrop.address)
            ])
            metadataMap[airdrop.mint] = metadata
            distributorMap[airdrop.address] = distributorData
          }))

          setTokenMetadata(metadataMap)
          setDistributor(distributorMap)
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsDataLoading(false)
        }
      }
      fetchData()
    }
  }, [airdrops])

  const handleRowClick = (airdropId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return
    router.push(`/airdrops/solana/devnet/${airdropId}`)
  }

  const handleNextPage = () => {
    if (totalAirdrops > currentPage * pageSize) setCurrentPage(currentPage + 1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const renderPagination = () => (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
        </PaginationItem>
        <PaginationItem>
          <Button onClick={handleNextPage} disabled={totalAirdrops <= currentPage * pageSize} variant="outline" size="sm">Next</Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )

  const isInstant = (d: DistributorInfo) => d.startTs === d.endTs 

  if (connected) return null

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Recent community airdrops</h2>
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
              {[1, 2, 3].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recent community airdrops</h2>
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
            {airdrops.map((airdrop, index) => (
              <TableRow key={index} onClick={(e) => handleRowClick(airdrop.address, e)} className="cursor-pointer hover:bg-secondary/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {tokenMetadata[airdrop.mint]?.image ? (
                      <Image src={tokenMetadata[airdrop.mint].image || ''} alt={tokenMetadata[airdrop.mint]?.symbol || 'Token'} width={32} height={32} className="rounded-full object-cover w-8 h-8" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        {'?'}
                      </div>
                    )}
                    <div>
                      <div>{tokenMetadata[airdrop.mint]?.symbol || 'Loading...'}</div>
                      <div className="text-xs text-muted-foreground">{airdrop.mint}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {distributor[airdrop.address] ? `${distributor[airdrop.address].numNodesClaimed || 0}/${airdrop.maxNumNodes}` : 'Loading...'}
                </TableCell>
                <TableCell>
                  {distributor[airdrop.address] && tokenMetadata[airdrop.mint] ?
                    `${(distributor[airdrop.address].totalAmountClaimed / Math.pow(10, tokenMetadata[airdrop.mint].decimals || 9)).toFixed(4)} / ${(Number(airdrop.maxTotalClaim) / Math.pow(10, tokenMetadata[airdrop.mint].decimals || 9)).toFixed(4)} ${tokenMetadata[airdrop.mint].symbol}`
                    : 'Loading...'}
                </TableCell>
                <TableCell>{airdrop.name}</TableCell>
                <TableCell>
                  {distributor[airdrop.address] ? (
                    <Badge variant={isInstant(distributor[airdrop.address]) ? "default" : "secondary"}>
                      {isInstant(distributor[airdrop.address]) ? "Instant" : "Vested"}
                    </Badge>
                  ) : (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </div>
  )
}
