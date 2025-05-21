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
import { SolanaDistributorClient } from "@streamflow/distributor/solana";
import { ICluster } from "@streamflow/common";
import { BN } from "bn.js";
import { getTokenMetadata } from "@/lib/token-utils";
import { calculateCSVTotals, transformCSVFormat } from "@/lib/merkle-utils";
import Image from "next/image";
import { useStreamflowAuth } from "@/hooks/use-streamflow-auth"
import { useToast } from "@/components/ui/use-toast"
import { AirdropItem } from "@/types/airdrop";
interface TokenMetadata {
  symbol: string
  image?: string
  icon?: string
  name?: string
  decimals: number
}

export default function ReviewPage() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { wallet, connected, publicKey } = useWallet()
  const { airdropData, resetAirdropData } = useAirdrop()
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [recipientCount, setRecipientCount] = useState<number>(0)
  const { loginToStreamflow } = useStreamflowAuth()
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const calculateTotals = async () => {
      if (airdropData.file) {
        const totals = await calculateCSVTotals(airdropData.file, airdropData.tokenDecimals);
        setTotalAmount(totals.totalAmount / Math.pow(10, airdropData.tokenDecimals));
        setRecipientCount(totals.maxNodes);
        const metadata = await getTokenMetadata(airdropData.token)
        setTokenMetadata(metadata)
      }
    }
    calculateTotals();

    if (!airdropData.file) {
      router.push("/airdrops/new/recipients")
    }
  }, [airdropData.file, airdropData.token, router])

  if (!isClient) return null

  const handleCreateAirdrop = async () => {
    setIsSubmitting(true)

    try {
      if (!publicKey || !airdropData.file) {
        throw new Error("Wallet not connected or file not uploaded")
      }

      const isAuthenticated = await loginToStreamflow()
      if (!isAuthenticated) {
        throw new Error("Authentication failed")
      }

      if (!localStorage.getItem("streamflow_sid")) {
        throw new Error("Authentication failed")
      }

      const transformedFile = await transformCSVFormat(
        airdropData.file,
        airdropData.tokenDecimals,
        airdropData.type
      );

      const formData = new FormData();
      formData.append('mint', airdropData.token);
      formData.append('name', airdropData.title);
      formData.append('file', transformedFile);
      const sid = localStorage.getItem("streamflow_sid");
      if (!sid) {
        throw new Error("Authentication failed - no session ID");
      }
      formData.append('sid', sid);

      const res = await fetch("/api/airdrops", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to create airdrop")
      }

      const data: AirdropItem = await res.json();
      console.log(data, "data")

      const client = new SolanaDistributorClient({
        clusterUrl: "https://api.devnet.solana.com",
        cluster: ICluster.Devnet,
      });

      const currentTimestamp = Math.floor(Date.now() / 1000);

      const startVestingTs = currentTimestamp + (5 * 60);

      let endVestingTs = startVestingTs;
      if (airdropData.type === "vested" && airdropData.distributionEndDate) {
        const [hours, minutes] = airdropData.distributionEndTime.split(':');
        const endDate = new Date(airdropData.distributionEndDate);
        endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        endVestingTs = Math.floor(endDate.getTime() / 1000);
      }

      const clawbackStartTs = startVestingTs;

      const response = await client.create(
        {
          mint: data.mint,
          version: Number(data.version),
          root: data.merkleRoot || [],
          maxNumNodes: Number(data.maxNumNodes),
          maxTotalClaim: Number(data.maxTotalClaim),
          unlockPeriod: parseInt(airdropData.unlockInterval),
          startVestingTs: startVestingTs,
          endVestingTs: endVestingTs,
          clawbackStartTs: clawbackStartTs,
          claimsClosableByAdmin: airdropData.cancellable,
        },
        {
          invoker: wallet?.adapter as any,
          isNative: airdropData.token === "So11111111111111111111111111111111111111112",
        }
      );
    
      console.log("Airdrop created:", response);


      // resetAirdropData()
      // router.push("/airdrops?tab=created")

    } catch (error) {
      console.error("Error creating airdrop:", error);
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!connected) {
    return (
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">STEP 4</h2>
          <h1 className="text-2xl font-bold">Review</h1>
          <p className="text-muted-foreground">Review your airdrop details before creating it.</p>
        </div>

        <WalletNotConnected />
      </div>
    )
  }

  // Check if the airdrop type is vested
  const isVested = airdropData.type === "vested"

  // Format unlock interval for display
  const formatUnlockInterval = (interval: string) => {
    switch (interval) {
      case "per_second":
        return "Per Second"
      case "per_minute":
        return "Per Minute"
      case "per_hour":
        return "Per Hour"
      case "daily":
        return "Daily"
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"
      case "quarterly":
        return "Quarterly"
      default:
        return interval.charAt(0).toUpperCase() + interval.slice(1)
    }
  }


  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">STEP 4</h2>
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="text-muted-foreground">Review your airdrop details before creating it.</p>
      </div>

      {/* Contract Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
              <p className="font-medium">{airdropData.title || "Untitled"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  {airdropData.type === "instant" ? "I" : "V"}
                </div>
                <p className="font-medium">{airdropData.type === "instant" ? "Instant" : "Vested"}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h3>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  {tokenMetadata?.icon ? <Image src={tokenMetadata.icon} alt={tokenMetadata.symbol} width={20} height={20} /> : tokenMetadata?.symbol.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium">{totalAmount} {tokenMetadata?.symbol}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Recipients</h3>
              <p className="font-medium">{recipientCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Distribution Start</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {airdropData.distributerStartTime ? format(airdropData.distributerStartTime, "MMM d, yyyy") : "Not set"}
                </p>
              </div>
            </div>

            {/* Show vesting configuration if applicable */}
            {isVested && airdropData.distributionEndDate && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Distribution End</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {format(airdropData.distributionEndDate, "MMM d, yyyy")} • {airdropData.distributionEndTime}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Unlock Interval</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{formatUnlockInterval(airdropData.unlockInterval)}</p>
                  </div>
                </div>
              </>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Cancellable</h3>
              <div className="flex items-center gap-2">
                {airdropData.cancellable ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="font-medium text-green-500">Yes</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <p className="font-medium text-red-500">No</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total recipients</h3>
            <div className="w-24 h-10 bg-secondary/50 rounded-md flex items-center justify-center font-medium">
              {recipientCount}
            </div>
          </div>

          {airdropData.file && (
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{airdropData.file.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{recipientCount} Recipients</p>
                    <p>Predefined in CSV</p>
                  </div>
                </div>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" asChild>
          <Link href="/airdrops/new/configuration">Back</Link>
        </Button>
        <Button
          onClick={handleCreateAirdrop}
          className="bg-primary hover:bg-primary/90 w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Airdrop"
          )}
        </Button>
      </div>
    </div>
  )
}
