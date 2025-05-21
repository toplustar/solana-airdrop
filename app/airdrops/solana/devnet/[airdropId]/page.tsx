"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import Image from "next/image"
import { Copy, ExternalLink, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import ConnectWalletButton from "@/components/ConnectWalletButton"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import { AirdropItem } from "@/types/airdrop"
import { DistributorInfo, TokenMetadata } from "@/types/metadata"

export default function AirdropDetailPage() {
  const { airdropId } = useParams()
  const { connected } = useWallet()

  const [mounted, setMounted] = useState(false)
  const [airdropData, setAirdropData] = useState<AirdropItem | null>(null)
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null)
  const [distributor, setDistributor] = useState<DistributorInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!airdropId) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/airdrops/${airdropId}`)
        const data = await res.json()
        setAirdropData(data)
      } catch (err) {
        console.error("Failed to fetch airdrop data:", err)
      }
    }
    fetchData()
  }, [airdropId])

  useEffect(() => {
    if (!airdropData) return

    const loadDetails = async () => {
      try {
        const [metadata, distributorInfo] = await Promise.all([
          getTokenMetadata(airdropData.mint),
          getDistributor(airdropData.address),
        ])
        setTokenMetadata(metadata)
        setDistributor(distributorInfo)
      } catch (err) {
        console.error("Failed to fetch metadata or distributor:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [airdropData])

  const isLoading = loading || !tokenMetadata || !distributor || !airdropData

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/airdrops">
            <ArrowLeft className="h-4 w-4" />
            Back to Airdrops
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!airdropData) {
    return <div className="container py-6">Airdrop not found</div>
  }

  const decimals = tokenMetadata?.decimals || 9

  return (
    <div className="container py-6 space-y-6">
      <Button variant="outline" size="sm" asChild className="gap-2">
        <Link href="/airdrops">
          <ArrowLeft className="h-4 w-4" />
          Back to Airdrops
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {tokenMetadata.image ? (
                <Image
                  src={tokenMetadata.image}
                  alt={tokenMetadata.symbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-sm">?</span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{tokenMetadata.name}</h1>
            <Badge variant="outline">Solana</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Token:</span>
              <Link href="#" className="flex items-center hover:underline">
                {airdropData.mint}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Sender:</span>
              <Link href="#" className="flex items-center hover:underline">
                {airdropData.sender}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Airdrop Type</div>
            <div className="text-2xl font-bold mt-1">
              <Badge variant={distributor.endTs === distributor.startTs ? "default" : "secondary"} className="text-sm">
                {distributor.endTs === distributor.startTs ? "Instant" : "Vested"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Recipients for {tokenMetadata.name}</div>
            <div className="text-2xl font-bold mt-1">{distributor.numNodesClaimed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Recipients Claimed / Total</div>
            <div className="text-2xl font-bold mt-1">
              {distributor.numNodesClaimed} / {airdropData.maxNumNodes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Amount Claimed / Total</div>
            <div className="text-2xl font-bold mt-1">
              {(distributor.totalAmountClaimed / Math.pow(10, decimals)).toFixed(4)} / {(Number(airdropData.maxTotalClaim) / Math.pow(10, decimals)).toFixed(4)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
