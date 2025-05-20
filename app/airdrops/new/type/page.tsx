"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@solana/wallet-adapter-react"
import WalletNotConnected from "@/components/wallet-not-connected"
import { useAirdrop } from "@/contexts/airdrop-context"

export default function NewAirdropTypePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { connected, publicKey } = useWallet()
  const router = useRouter()
  const { updateAirdropType } = useAirdrop()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    updateAirdropType(type)
  }

  const handleNextStep = () => {
    if (selectedType) {
      router.push("/airdrops/new/recipients")
    }
  }

  if (!isClient) return null

  if (!connected) {
    return (
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">STEP 1</h2>
          <h1 className="text-2xl font-bold">Choose Airdrop Type</h1>
        </div>
        <WalletNotConnected />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">STEP 1</h2>
        <h1 className="text-2xl font-bold">Choose Airdrop Type</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer border-2 transition-colors ${
            selectedType === "instant" ? "border-primary" : "border-border"
          }`}
          onClick={() => handleTypeSelect("instant")}
        >
          <CardHeader>
            <CardTitle>Instant Airdrop</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Create an airdrop that instantly releases tokens to recipients.</CardDescription>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border-2 transition-colors ${
            selectedType === "vested" ? "border-primary" : "border-border"
          }`}
          onClick={() => handleTypeSelect("vested")}
        >
          <CardHeader>
            <CardTitle>Vested Airdrop</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create an airdrop that gradually releases tokens to recipients after a certain period of time.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-8">
        <Button size="lg" disabled={!selectedType} onClick={handleNextStep}>
          Next Step
        </Button>
      </div>
    </div>
  )
}
