"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, FileText, XCircle, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAirdrop } from "@/contexts/airdrop-context"
import WalletNotConnected from "@/components/wallet-not-connected"
import { format } from "date-fns"
import { SolanaDistributorClient } from "@streamflow/distributor/solana"
import { ICluster } from "@streamflow/common"
import { getTokenMetadata } from "@/lib/token-utils"
import { calculateCSVTotals, transformCSVFormat } from "@/lib/merkle-utils"
import Image from "next/image"
import { useStreamflowAuth } from "@/hooks/use-streamflow-auth"
import { AirdropItem } from "@/types/airdrop"
import { TokenMetadata } from "@/types/metadata"
import { useSnackbar } from "notistack"

export default function ReviewPage() {
  const router = useRouter()
  const { wallet, connected, publicKey } = useWallet()
  const { airdropData, resetAirdropData } = useAirdrop()
  const { loginToStreamflow } = useStreamflowAuth()
  const { enqueueSnackbar } = useSnackbar()

  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [recipientCount, setRecipientCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!airdropData.file) {
        router.push("/airdrops/new/recipients")
        return
      }

      try {
        const totals = await calculateCSVTotals(airdropData.file, airdropData.tokenDecimals)
        setTotalAmount(totals.totalAmount / Math.pow(10, airdropData.tokenDecimals))
        setRecipientCount(totals.maxNodes)

        const metadata = await getTokenMetadata(airdropData.token)
        setTokenMetadata(metadata)
      } catch (err) {
        enqueueSnackbar("Error processing airdrop file", { variant: "error" })
      }
    }

    init()
  }, [airdropData])

  const handleCreateAirdrop = async () => {
    setIsSubmitting(true)

    try {
      if (!publicKey || !airdropData.file) throw new Error("Wallet not connected or file missing")

      const authenticated = await loginToStreamflow()
      if (!authenticated) throw new Error("Authentication failed")

      const sid = localStorage.getItem("streamflow_sid")
      if (!sid) throw new Error("Missing session ID")

      const transformed = await transformCSVFormat(
        airdropData.file,
        airdropData.tokenDecimals,
        airdropData.type
      )

      const formData = new FormData()
      formData.append("mint", airdropData.token)
      formData.append("name", airdropData.title)
      formData.append("file", transformed)
      formData.append("sid", sid)

      const backendRes = await fetch("/api/airdrops", { method: "POST", body: formData })
      if (!backendRes.ok) throw new Error("Failed to create airdrop")
      const data: AirdropItem = await backendRes.json()

      const client = new SolanaDistributorClient({
        clusterUrl: "https://api.devnet.solana.com",
        cluster: ICluster.Devnet,
      })

      const now = Math.floor(Date.now() / 1000)
      const start = now + 10
      let end = start

      if (airdropData.type === "vested" && airdropData.distributionEndDate) {
        const [h, m] = airdropData.distributionEndTime.split(":")
        const endDate = new Date(airdropData.distributionEndDate)
        endDate.setHours(parseInt(h), parseInt(m), 0, 0)
        end = Math.floor(endDate.getTime() / 1000)
      }

      const onChainRes = await client.create(
        {
          mint: data.mint,
          version: Number(data.version),
          root: data.merkleRoot || [],
          maxNumNodes: Number(data.maxNumNodes),
          maxTotalClaim: Number(data.maxTotalClaim),
          unlockPeriod: parseInt(airdropData.unlockInterval),
          startVestingTs: start,
          endVestingTs: end,
          clawbackStartTs: start,
          claimsClosableByAdmin: airdropData.cancellable,
        },
        {
          invoker: wallet?.adapter as any,
          isNative: airdropData.token === "So11111111111111111111111111111111111111112",
        }
      )

      if (!onChainRes.metadataId) throw new Error("Chain transaction failed")

      router.push(`/airdrops/solana/devnet/${onChainRes.metadataId}`)
      setTimeout(() => {
        resetAirdropData()
      }, 500)
    } catch (err: any) {
      enqueueSnackbar(err.message || "Failed to create airdrop", { variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!connected) {
    return (
      <div className="container py-6 space-y-6 max-w-4xl">
        <h2 className="text-sm font-medium text-muted-foreground">STEP 4</h2>
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="text-muted-foreground">Review your airdrop details before creating it.</p>
        <WalletNotConnected />
      </div>
    )
  }

  const isVested = airdropData.type === "vested"
  const formatUnlockInterval = (value: string) =>
    value.replace("_", " ").replace(/^./, s => s.toUpperCase())

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <h2 className="text-sm font-medium text-muted-foreground">STEP 4</h2>
      <h1 className="text-2xl font-bold">Review</h1>
      <p className="text-muted-foreground">Review your airdrop details before creating it.</p>

      <Card>
        <CardHeader><CardTitle>Contract Overview</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><h3 className="text-sm mb-1 text-muted-foreground">Title</h3><p className="font-medium">{airdropData.title}</p></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-primary text-xs text-primary-foreground rounded-full flex items-center justify-center">
              {airdropData.type === "instant" ? "I" : "V"}
            </div>
            <p className="font-medium">{airdropData.type === "instant" ? "Instant" : "Vested"}</p>
          </div>
          <div className="flex items-center gap-2">
            {tokenMetadata?.image ? <Image src={tokenMetadata.image} alt="" width={20} height={20} /> : "?"}
            <p className="font-medium">{totalAmount} {tokenMetadata?.symbol}</p>
          </div>
          <div><h3 className="text-sm mb-1 text-muted-foreground">Total Recipients</h3><p className="font-medium">{recipientCount}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">
              {airdropData.distributerStartTime ? format(airdropData.distributerStartTime, "MMM d, yyyy") : "Not set"}
            </p>
          </div>

          {isVested && airdropData.distributionEndDate && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {format(airdropData.distributionEndDate, "MMM d, yyyy")} • {airdropData.distributionEndTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatUnlockInterval(airdropData.unlockInterval)}</p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            {airdropData.cancellable ? <CheckCircle className="text-green-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}
            <p className={`font-medium ${airdropData.cancellable ? "text-green-500" : "text-red-500"}`}>{airdropData.cancellable ? "Yes" : "No"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recipients</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="w-24 h-10 bg-secondary/50 rounded-md flex items-center justify-center font-medium">
            {recipientCount}
          </div>

          {airdropData.file && (
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{airdropData.file.name}</h3>
                  <p className="text-sm text-muted-foreground">{recipientCount} Recipients • Predefined in CSV</p>
                </div>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button variant="outline" asChild>
          <Link href="/airdrops/new/configuration">Back</Link>
        </Button>
        <Button onClick={handleCreateAirdrop} disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Airdrop"}
        </Button>
      </div>
    </div>
  )
}
