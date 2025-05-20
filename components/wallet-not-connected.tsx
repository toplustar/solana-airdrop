"use client"
import { AlertCircle } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import ConnectWalletButton from "./ConnectWalletButton"

export default function WalletNotConnected() {
  const { connected } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (connected) return null

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border border-dashed rounded-lg">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Wallet Not Connected</h2>
      <p className="text-muted-foreground max-w-md">
        Please connect your Solana wallet to access this feature. You need to be connected to the Solana devnet.
      </p>
      <ConnectWalletButton />

      <div className="text-xs text-muted-foreground mt-4 max-w-md">
        <p className="font-medium mb-1">Having trouble connecting?</p>
        <ol className="list-decimal list-inside text-left space-y-1">
          <li>Make sure Phantom wallet extension is installed</li>
          <li>Check that you're logged into your Phantom wallet</li>
          <li>Try refreshing the page and connecting again</li>
          <li>Switch to Devnet in your Phantom wallet settings</li>
        </ol>
      </div>
    </div>
  )
}
