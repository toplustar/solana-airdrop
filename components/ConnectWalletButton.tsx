"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { connected, connecting } = useWallet()
  const { visible, setVisible } = useWalletModal()
  const [mounted, setMounted] = useState(false)
  console.log(connected, connecting, "connected, connecting")

  useEffect(() => {
    setMounted(true)
  }, [])


  if (!mounted) return null

  return (
    <Button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className={className}
      variant="default"
      size="sm"
    >
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  )
}
