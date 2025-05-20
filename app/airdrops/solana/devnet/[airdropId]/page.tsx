"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ExternalLink, ArrowLeft } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import ConnectWalletButton from "@/components/ConnectWalletButton"
import { useParams } from "next/navigation"
import { getTokenMetadata } from "@/lib/token-utils"
import { getDistributor } from "@/lib/streamflow-client"
import { AirdropItem } from "@/types/airdrop"
import { DistributorInfo, TokenMetadata } from "@/types/metadata"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

export default function AirdropDetailPage() {
  const params = useParams()
  const { airdropId } = params
  const { connected } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [airdropData, setAirdropData] = useState<AirdropItem | null>(null)
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null)
  const [distributor, setDistributor] = useState<DistributorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  console.log(airdropId, "airdropId")
  console.log(tokenMetadata, "tokenMetadata")
  console.log(distributor, "distributor")
  console.log(airdropData, "airdropData")
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchAirdropData()
  }, [airdropId])

  useEffect(() => {
    if (airdropData) {
      fetchTokenMetadata()
      fetchDistributor()
      setLoading(false)
    }
  }, [airdropData])
  
  const fetchAirdropData = async () => {
    const response = await fetch(`/api/airdrops/${airdropId}`)
    const data = await response.json()
    setAirdropData(data)
  }

  const fetchTokenMetadata = async () => {
    if (!airdropData?.mint) return;
    const response = await getTokenMetadata(airdropData.mint)
    setTokenMetadata(response)
  }

  const fetchDistributor = async () => {
    if (!airdropData?.address) return;
    const response = await getDistributor(airdropData.address)
    setDistributor(response)
  }
 
  const isLoading = loading || !tokenMetadata || !distributor || !airdropData;

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/airdrops">
              <ArrowLeft className="h-4 w-4" />
              Back to Airdrops
            </Link>
          </Button>
        </div>

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
    );
  }

  if (!airdropData) {
    return <div className="container py-6">Airdrop not found</div>
  }

  const copyToClipboard = () => {
    const url = window.location.href
    navigator.clipboard
      .writeText(url)
      .then(() => {
      })
      .catch(() => {
      })
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/airdrops">
            <ArrowLeft className="h-4 w-4" />
            Back to Airdrops
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {tokenMetadata?.image ? 
                <Image 
                    src={tokenMetadata.image} 
                    alt={tokenMetadata.symbol} 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                /> : 
                <span className="text-sm">?</span>}
            </div>
            <h1 className="text-2xl font-bold">{tokenMetadata?.name}</h1>
            <Badge variant="outline">Solana</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Token:</span>
              <Link href="#" className="flex items-center hover:underline">
                {airdropData?.mint}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Sender:</span>
              <Link href="#" className="flex items-center hover:underline">
                {airdropData?.sender}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Airdrop Type</div>
            <div className="text-2xl font-bold mt-1">
              <Badge variant={distributor?.endTs === distributor?.startTs ? "default" : "secondary"} className="text-sm">
                {distributor?.endTs === distributor?.startTs ? "Instant" : "Vested"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Recipients for {tokenMetadata?.name}</div>
            <div className="text-2xl font-bold mt-1">{distributor?.numNodesClaimed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Recipients Claimed / Total</div>
            <div className="text-2xl font-bold mt-1">
               {distributor?.numNodesClaimed} / {airdropData?.maxNumNodes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Amount Claimed / Total</div>
            <div className="text-2xl font-bold mt-1">
              {Number(distributor?.totalAmountClaimed) / Math.pow(10, tokenMetadata?.decimals || 9)} / {Number(airdropData?.maxTotalClaim) / Math.pow(10, tokenMetadata?.decimals || 9)}
            </div>
          </CardContent>
        </Card>
      </div>

     
      {/* {mounted && connected ? (
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-medium mb-4">Your Allocation</h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium">{airdrop.userAllocation.amount}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground">Wallet</div>
              <div className="font-medium">{airdrop.userAllocation.walletAddress}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Explorer</div>
              <Link href="#" className="text-primary flex items-center hover:underline">
                View
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Claim Date</div>
              <div className="font-medium">{airdrop.userAllocation.claimDate}</div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline">{airdrop.userAllocation.status}</Badge>
              <Button size="sm" className="ml-auto">
                Claim
              </Button>
            </div>
          </div>
        </div>
      ) : mounted ? (
        <div className="rounded-md border p-6 text-center">
          <h2 className="text-lg font-medium mb-2">Connect your wallet to view your allocation</h2>
          <p className="text-muted-foreground mb-4">
            You need to connect your wallet to see if you have an allocation in this airdrop.
          </p>
          <ConnectWalletButton className="mx-auto" />
        </div>
      ) : null} */}
    </div>
  )
}
