"use client"

import { type FC, type ReactNode, useMemo, useEffect } from "react"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl } from "@solana/web3.js"
import bs58 from "bs58"

// Import wallet adapter styles
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

      const res = await fetch(`/api/auth/state/SOLANA/${publicKey.toBase58()}`, {
        method: 'POST',
      })
      const data1 = await res.json()
      console.log(data1)

      const iat = Math.floor(Date.now() / 1000);
      const state = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const authMessage = `By signing this message, I confirm that I have read and accepted the Terms and Conditions at https://strm.me/tos, Privacy Policy at https://strm.me/pp and Restricted Countries or Regions Policy at https://strm.me/restricted.

This request will not trigger a blockchain transaction or cost any gas fees.

iat: ${iat}
state: ${state}`;

    const encodedMessage = new TextEncoder().encode(authMessage);
    const signature = await signMessage(encodedMessage);
    const signatureBase58 = bs58.encode(signature);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({chain: "SOLANA", walletAddress: publicKey.toBase58(), signature: signatureBase58, authMessage, referral: null })
    })

    const data = await response.json()

    console.log(data)
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
