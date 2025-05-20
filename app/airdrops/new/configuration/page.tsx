"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Calendar, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAirdrop } from "@/contexts/airdrop-context"
import WalletNotConnected from "@/components/wallet-not-connected"
import { getSolanaConnection } from "@/lib/solana-wallet"
import type { Connection, PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { getTokenMetadata } from "@/lib/token-utils"
import Image from "next/image"
// Token interface
interface Token {
  symbol: string
  address: string
  icon?: string
  balance: string
  mint: string
  decimals: number
  rawBalance: number
  price?: number
}


export default function ConfigurationPage() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { connected, publicKey } = useWallet()
  const { airdropData, updateConfiguration } = useAirdrop()

  const [title, setTitle] = useState(airdropData.title)
  const [token, setToken] = useState(airdropData.token)
  const [startUponCreation, setStartUponCreation] = useState(airdropData.startUponCreation)
  const [cancellable, setCancellable] = useState(airdropData.cancellable)
  const [claimOnce, setClaimOnce] = useState(airdropData.claimOnce)
  const [walletTokens, setWalletTokens] = useState<Token[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [distributionEndDate, setDistributionEndDate] = useState<Date | undefined>(
    airdropData.distributionEndDate || undefined,
  )
  const [distributionEndTime, setDistributionEndTime] = useState(airdropData.distributionEndTime || "12:00")
  const [unlockInterval, setUnlockInterval] = useState(airdropData.unlockInterval || "daily")
  const [distributionEndTimeError, setDistributionEndTimeError] = useState<string | null>(null)
  

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if the airdrop type is vested
  const isVested = airdropData.type === "vested"

  

  // Fetch tokens from wallet
  useEffect(() => {
    async function fetchWalletTokens() {
      if (!connected || !publicKey) return

      setIsLoadingTokens(true)
      setTokenError(null)

      try {
        const connection = getSolanaConnection("devnet")

        // Get SOL balance and price
        const [solBalance, solPriceResponse] = await Promise.all([
          connection.getBalance(publicKey),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        ]);

        const solPriceData = await solPriceResponse.json();
        const solPrice = solPriceData.solana.usd;

        const solToken: Token = {
          symbol: "SOL",
          address: "So11111111111111111111111111111111111111112",
          icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          balance: (solBalance / 1e9).toString(),
          mint: "So11111111111111111111111111111111111111112",
          decimals: 9,
          rawBalance: solBalance,
          price: solPrice
        }

        const tokens = await fetchSPLTokens(connection, publicKey)

        // Combine SOL with SPL tokens
        const allTokens = [solToken, ...tokens]

        setWalletTokens(allTokens)

        // If no token is selected yet and we have tokens, select the first one
        if (!token && allTokens.length > 0) {
          setToken(allTokens[0].address)
        }
      } catch (error) {
        console.error("Error fetching wallet tokens:", error)
        setTokenError("Failed to load tokens. Please try again.")
      } finally {
        setIsLoadingTokens(false)
      }
    }

    fetchWalletTokens()
  }, [connected, publicKey, token])

  // Function to fetch SPL tokens
  async function fetchSPLTokens(connection: Connection, publicKey: PublicKey): Promise<Token[]> {
    try {
      // Get all token accounts owned by the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })

      // Filter out tokens with zero balance and wSOL
      const nonZeroTokens = tokenAccounts.value.filter((tokenAccount) => {
        const parsedInfo = tokenAccount.account.data.parsed.info
        const amount = parsedInfo.tokenAmount.uiAmount
        const mintAddress = parsedInfo.mint
        return amount > 0 && mintAddress !== "So11111111111111111111111111111111111111112"
      })

      // Map token accounts to our Token interface
      const tokens = await Promise.all(nonZeroTokens.map(async (tokenAccount) => {
        const parsedInfo = tokenAccount.account.data.parsed.info
        const mintAddress = parsedInfo.mint
        const balance = parsedInfo.tokenAmount.uiAmount
        const decimals = parsedInfo.tokenAmount.decimals
        const rawBalance = Number(parsedInfo.tokenAmount.amount)

        // Get token info (symbol and icon)
        const tokenInfo = await getTokenMetadata(mintAddress)

        return {
          symbol: tokenInfo.symbol,
          address: mintAddress,
          icon: tokenInfo.image,
          balance: balance.toString(),
          mint: mintAddress,
          decimals,
          rawBalance,
        }
      }))

      return tokens
    } catch (error) {
      console.error("Error fetching SPL tokens:", error)
      return []
    }
  }

  // Redirect if no file is uploaded
  useEffect(() => {
    if (!airdropData.file) {
      router.push("/airdrops/new/recipients")
    }
  }, [airdropData.file, router])

  const handleDeleteCsv = () => {
    router.push("/airdrops/new/recipients")
  }

  const handleNextStep = () => {
    // Save configuration to context
    updateConfiguration({
      title,
      token,
      startUponCreation,
      cancellable,
      claimOnce,
      distributionEndDate,
      distributionEndTime,
      unlockInterval,
      distributerStartTime: new Date(),
    })
    router.push("/airdrops/new/review")
  }

  // Update validation function to include unlock interval check
  const validateEndDateTime = (date: Date | undefined, time: string, interval: string) => {
    if (!date) return null
    
    const [hours, minutes] = time.split(':').map(Number)
    const endDateTime = new Date(date)
    endDateTime.setHours(hours, minutes)
    
    if (endDateTime <= new Date()) {
      return "End time must be in the future"
    }

    // Calculate duration in seconds
    const durationInSeconds = (endDateTime.getTime() - new Date().getTime()) / 1000
    const intervalSeconds = parseInt(interval)

    if (durationInSeconds < intervalSeconds) {
      return `Unlock interval (${formatInterval(intervalSeconds)}) must be smaller than the total duration (${formatDuration(durationInSeconds)})`
    }

    return null
  }

  // Helper function to format interval for display
  const formatInterval = (seconds: number) => {
    if (seconds === 1) return "1 second"
    if (seconds === 60) return "1 minute"
    if (seconds === 3600) return "1 hour"
    if (seconds === 86400) return "1 day"
    if (seconds === 604800) return "1 week"
    if (seconds === 2592000) return "1 month"
    if (seconds === 94608000) return "1 quarter"
    return `${seconds} seconds`
  }

  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  // Update the time change handler
  const handleEndTimeChange = (newTime: string) => {
    setDistributionEndTime(newTime)
    const error = validateEndDateTime(distributionEndDate, newTime, unlockInterval)
    setDistributionEndTimeError(error)
  }

  // Update the date change handler
  const handleEndDateChange = (newDate: Date | undefined) => {
    setDistributionEndDate(newDate)
    if (newDate) {
      const error = validateEndDateTime(newDate, distributionEndTime, unlockInterval)
      setDistributionEndTimeError(error)
    } else {
      setDistributionEndTimeError(null)
    }
  }

  // Add handler for unlock interval changes
  const handleUnlockIntervalChange = (newInterval: string) => {
    setUnlockInterval(newInterval)
    if (distributionEndDate) {
      const error = validateEndDateTime(distributionEndDate, distributionEndTime, newInterval)
      setDistributionEndTimeError(error)
    }
  }

  // Update the isFormValid check
  const isFormValid =
    title.trim() !== "" && 
    airdropData.file !== null && 
    (!isVested || (isVested && distributionEndDate !== undefined && !distributionEndTimeError))

  if (!isClient) return null

  if (!connected) {
    return (
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">STEP 3</h2>
          <h1 className="text-2xl font-bold">Configure Airdrop</h1>
        </div>

        <WalletNotConnected />
      </div>
    )
  }

  // Function to render token icon
  const renderTokenIcon = (t: Token) => {
    return (
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-foreground">
         {t.icon ? <Image src={t.icon} alt={t.symbol} width={24} height={24}  className="rounded-full"/> : <span className="text-sm">?</span>}
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">STEP 3</h2>
        <h1 className="text-2xl font-bold">Configure Airdrop</h1>
      </div>

      <form className="space-y-8">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. The Best Airdrop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Token Selector */}
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <Select 
            value={token}
            onValueChange={(selectedAddress) => {
              setToken(selectedAddress);
              const selectedToken = walletTokens.find(t => t.address === selectedAddress);
              if (selectedToken) {
                updateConfiguration({
                  ...airdropData,
                  token: selectedToken.address,
                  tokenDecimals: selectedToken.decimals
                });
              }
            }} 
            disabled={isLoadingTokens}
          >
            <SelectTrigger id="token" className="w-full">
              {isLoadingTokens ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading tokens...</span>
                </div>
              ) : (
                <SelectValue>
                  {walletTokens.find(t => t.address === token) && (
                    <div className="flex items-center gap-2">
                      {renderTokenIcon(walletTokens.find(t => t.address === token)!)}
                      <span>
                        {walletTokens.find(t => t.address === token)?.symbol}
                        {` (${token.substring(0, 4)}...${token.substring(token.length - 4)})`}
                      </span>
                    </div>
                  )}
                </SelectValue>
              )}
            </SelectTrigger>
            <SelectContent>
              {tokenError ? (
                <div className="p-2 text-center text-red-500 text-sm">{tokenError}</div>
              ) : walletTokens.length > 0 ? (
                walletTokens.map((t) => (
                  <SelectItem key={t.mint} value={t.address}>
                    <div className="w-full flex items-center justify-end">
                      <div className="flex items-center gap-2">
                        {renderTokenIcon(t)}
                        <div className="flex flex-col">
                          <span>{t.symbol} ({t.address.substring(0, 4)}...{t.address.substring(t.address.length - 4)})</span>
                          <span className="text-xs text-muted-foreground">
                            {t.address.substring(0, 4)}...{t.address.substring(t.address.length - 4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span>{t.balance} {t.symbol}</span>
                        <span>{t.price && `$${(t.price * parseFloat(t.balance)).toFixed(2)}`}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-muted-foreground">No tokens found in wallet</div>
              )}
            </SelectContent>
          </Select>
          {walletTokens.length === 0 && !isLoadingTokens && !tokenError && (
            <p className="text-sm text-muted-foreground mt-1">
              Your wallet doesn't have any tokens. Please add some tokens to your wallet to continue.
            </p>
          )}
        </div>

        {/* Toggle: Start upon contract creation */}
        <div className="flex items-center justify-between">
          <Label htmlFor="start-upon-creation" className="cursor-pointer">
            Start upon contract creation
          </Label>
          <Switch id="start-upon-creation" checked={startUponCreation} onCheckedChange={setStartUponCreation} />
        </div>

        {/* Vesting Configuration - Only show if airdrop type is vested */}
        {isVested && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Vesting Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Distribution End Date */}
              <div className="space-y-2">
                <Label htmlFor="distribution-end-date">Distribution End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="distribution-end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !distributionEndDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {distributionEndDate ? format(distributionEndDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={distributionEndDate}
                      onSelect={handleEndDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Distribution End Time */}
              <div className="space-y-2">
                <Label htmlFor="distribution-end-time">Distribution End Time</Label>
                <div className="flex items-center">
                  <Button variant="outline" size="icon" className="mr-2">
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Input
                    id="distribution-end-time"
                    type="time"
                    value={distributionEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className={cn("flex-1", distributionEndTimeError && "border-red-500")}
                  />
                </div>
                {distributionEndTimeError && (
                  <p className="text-sm text-red-500 mt-1">{distributionEndTimeError}</p>
                )}
              </div>

              {/* Unlock Interval */}
              <div className="space-y-2">
                <Label htmlFor="unlock-interval">Unlock Interval</Label>
                <Select value={unlockInterval} onValueChange={handleUnlockIntervalChange}>
                  <SelectTrigger id="unlock-interval" className="w-full">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Per Second</SelectItem>
                    <SelectItem value="60">Per Minute</SelectItem>
                    <SelectItem value="3600">Per Hour</SelectItem>
                    <SelectItem value="86400">Daily</SelectItem>
                    <SelectItem value="604800">Weekly</SelectItem>
                    <SelectItem value="2592000">Monthly</SelectItem>
                    <SelectItem value="94608000">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Tokens will unlock gradually at this interval until the distribution end date.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toggle: Cancellable Airdrop */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cancellable" className="cursor-pointer">
              Cancellable Airdrop
            </Label>
            <Switch id="cancellable" checked={cancellable} onCheckedChange={setCancellable} />
          </div>
          <p className="text-sm text-muted-foreground">
            The creator can cancel the airdrop campaign at any time. If cancelled after the distribution start date,
            0.99% of the returned tokens will be reserved for platform maintenance.
          </p>
        </div>

        {/* Toggle: Claim once */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="claim-once" className="cursor-pointer">
              Claim once
            </Label>
            <Switch id="claim-once" checked={claimOnce} onCheckedChange={setClaimOnce} />
          </div>
          <p className="text-sm text-muted-foreground">
            This option limits the number of claims a recipient can make to 1. This means that every claimant can only
            claim the airdrop once and any tokens remaining after the first claim will be unclaimable.
          </p>
        </div>

        {/* Total Recipients */}
        <div className="space-y-2">
          <Label htmlFor="total-recipients">Total Recipients</Label>
          <Input
            id="total-recipients"
            value={airdropData.recipientCount.toString()}
            readOnly
            className="bg-secondary/50 cursor-not-allowed"
          />
        </div>

        {/* CSV File Summary Card */}
        {airdropData.file && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{airdropData.file.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {airdropData.recipientCount} recipient{airdropData.recipientCount !== 1 ? "s" : ""}
                    </p>
                    <p>Token type: Defined in CSV</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteCsv}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Delete CSV file</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" asChild>
          <Link href="/airdrops/new/recipients">Back</Link>
        </Button>
        <Button disabled={!isFormValid} onClick={handleNextStep} className="bg-primary hover:bg-primary/90">
          Next Step
        </Button>
      </div>
    </div>
  )
}
