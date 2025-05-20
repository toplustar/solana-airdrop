import { Connection, type PublicKey, clusterApiUrl } from "@solana/web3.js"

// Define the Phantom provider interface
export interface PhantomProvider {
  publicKey: PublicKey | null
  isConnected: boolean | null
  signTransaction: (transaction: any) => Promise<any>
  signAllTransactions: (transactions: any[]) => Promise<any[]>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: string, callback: (args: any) => void) => void
  request: (method: any, params: any) => Promise<any>
}

// Update the getProvider function to handle errors more gracefully
export const getProvider = (): PhantomProvider | undefined => {
  if (typeof window !== "undefined") {
    try {
      const provider = (window as any)?.solana

      if (provider?.isPhantom) {
        return provider
      }
    } catch (error) {
      console.error("Error checking for Phantom provider:", error)
    }
  }

  return undefined
}

// Get Solana connection based on network
export const getSolanaConnection = (network: "mainnet-beta" | "devnet" | "testnet" = "devnet") => {
  return new Connection(clusterApiUrl(network), "confirmed")
}

// Helper to shorten wallet address for display
export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
