"use client"

import type React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AirdropItem } from "@/types/airdrop"
import { DistributorInfo } from "@/types/metadata"
import { TokenMetadata } from "@/types/metadata"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import Image from "next/image"


export default function AirdropTable() {

  const router = useRouter()
  const { connected, publicKey } = useWallet()
  const [airdrops, setAirdrops] = useState<AirdropItem[]>([])
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [distributor, setDistributor] = useState<Record<string, DistributorInfo>>({})
  const [totalAirdrops, setTotalAirdrops] = useState(0)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [isDistributorLoading, setIsDistributorLoading] = useState(true)

  useEffect(() => {
      const fetchAirdrops = async () => {
        try {
          const response = await fetch('/api/airdrops/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(
              {
                "actor": publicKey?.toBase58(),
                "limit": 50,
                "offset": 0,
                "filters": {
                    "include": {
                        "isOnChain": true,
                        "sender": [
                            publicKey?.toBase58()
                        ]
                    }
                },
                "sorters": [
                    {
                        "by": "id",
                        "order": "desc"
                    }
                ]
            }
             )
          })
          const data = await response.json()
          setAirdrops(data.items)
          setTotalAirdrops(data.total)
        } catch (error) {
          console.error('Error fetching airdrops:', error)
        }
      }
      fetchAirdrops()
  }, [])

  useEffect(() => {
    const fetchDistributor = async () => {
      setIsDistributorLoading(true)
      const distributorPromises = airdrops?.map(async (airdrop) => {
        try {
          const distributor = await getDistributor(airdrop.address)
          setDistributor(prev => ({
            ...prev,
            [airdrop.address]: distributor
          }))
        } catch (error) {
          console.error(`Error fetching distributor for ${airdrop.address}:`, error)
        }
      })
      await Promise.all(distributorPromises || [])
      setIsDistributorLoading(false)
    }
    
    const fetchAllMetadata = async () => {
      setIsMetadataLoading(true)
      const metadataPromises = airdrops?.map(async (airdrop) => {
        try {
          const metadata = await getTokenMetadata(airdrop.mint)
          setTokenMetadata(prev => ({
            ...prev,
            [airdrop.mint]: metadata
          }))
        } catch (error) {
          console.error(`Error fetching metadata for ${airdrop.mint}:`, error)
        }
      })
      await Promise.all(metadataPromises || [])
      setIsMetadataLoading(false)
    }

    if (airdrops?.length > 0) {
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchAllMetadata(),
            fetchDistributor()
          ])
        } finally {
          setIsDataLoading(false)
        }
      }
      fetchData()
    }
  }, [airdrops])

  const isLoading = isDataLoading || isMetadataLoading || isDistributorLoading

  const handleRowClick = (airdropId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) {
      return
    }
    router.push(`/airdrops/solana/devnet/${airdropId}`)
  }

  if (isLoading) {
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
    )
  }

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
          {airdrops?.map((airdrop, index) => (
            <TableRow
              key={index}
              onClick={(e) => handleRowClick(airdrop.address, e)}
              className="cursor-pointer hover:bg-secondary/50"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {tokenMetadata[airdrop.mint]?.image ? (
                    <Image
                      src={tokenMetadata[airdrop.mint].image as string}
                      alt={`${tokenMetadata[airdrop.mint]?.symbol || 'Token'} icon`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      ?
                    </div>
                  )}
                  <div>
                    <div>{tokenMetadata[airdrop.mint]?.symbol || 'Loading...'}</div>
                    <div className="text-xs text-muted-foreground">{airdrop.mint}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {distributor[airdrop.address] ? 
                  `${distributor[airdrop.address].numNodesClaimed || 0}/${airdrop.maxNumNodes}` :
                  'Loading...'
                }
              </TableCell>
              <TableCell>
                {distributor[airdrop.address] && tokenMetadata[airdrop.mint] ? 
                  `${(distributor[airdrop.address].totalAmountClaimed / Math.pow(10, tokenMetadata[airdrop.mint].decimals || 9)).toFixed(2)} / 
                   ${(Number(airdrop.maxTotalClaim) / Math.pow(10, tokenMetadata[airdrop.mint].decimals || 9)).toFixed(2)} 
                   ${tokenMetadata[airdrop.mint].symbol}` :
                  'Loading...'
                }
              </TableCell>
              <TableCell>{airdrop.name}</TableCell>
              <TableCell>
                {distributor[airdrop.address] ? (
                  <Badge variant={distributor[airdrop.address].startTs === distributor[airdrop.address].endTs ? "default" : "secondary"}>
                    {distributor[airdrop.address].startTs === distributor[airdrop.address].endTs ? "Instant" : "Vested"}
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
  )
}
