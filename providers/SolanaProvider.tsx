"use client"

import { type FC, type ReactNode, useMemo, useEffect } from "react"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl } from "@solana/web3.js"
import bs58 from "bs58"

import "@solana/wallet-adapter-react-ui/styles.css"

interface SolanaProviderProps {
  children: ReactNode
}

const WalletConnectionListener: FC = () => {
  const { connected, publicKey, signMessage } = useWallet();

  useEffect(() => {
    const loginToStreamflow = async () => {
      if (!connected || !publicKey || !signMessage) return;

      const session = await fetch('/api/auth/session', {
        method: 'GET',
      })
      const sessionData = await session.json()
      console.log("🔹 sessionData:", sessionData);
  }
  loginToStreamflow()
}, [connected, publicKey, signMessage]);

  return null;

}

const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet

  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect
      >
        <WalletModalProvider>
          <WalletConnectionListener />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default SolanaProvider
