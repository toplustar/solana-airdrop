import { useWallet } from "@solana/wallet-adapter-react"
import { useCallback } from "react"
import bs58 from "bs58"

export const useStreamflowAuth = () => {
    const { connected, publicKey, signMessage } = useWallet()

    const loginToStreamflow = useCallback(async () => {
        if (!connected || !publicKey || !signMessage) {
            throw new Error("Wallet not connected")
        }

        const session = await fetch('/api/auth/session', {
            method: 'GET',
        })
        const sessionData = await session.json()

        if (sessionData && sessionData.user) {
            return true
        }

        const res = await fetch(`/api/auth/state/SOLANA/${publicKey.toBase58()}`, {
            method: 'POST',
        })
        const state = await res.json()

        const iat = Math.floor(Date.now() / 1000)
        const authMessage = `By signing this message, I confirm that I have read and accepted the Terms and Conditions at https://strm.me/tos, Privacy Policy at https://strm.me/pp and Restricted Countries or Regions Policy at https://strm.me/restricted.

This request will not trigger a blockchain transaction or cost any gas fees.

iat: ${iat}
state: ${state}`

        const encodedMessage = new TextEncoder().encode(authMessage)
        const signature = await signMessage(encodedMessage)
        const signatureBase58 = bs58.encode(signature)

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                chain: "SOLANA",
                walletAddress: publicKey.toBase58(),
                signature: signatureBase58,
                authMessage,
                referral: null
            })
        })
        console.log(response.status, response.ok)
        return response.ok
    }, [connected, publicKey, signMessage])

    return {
        loginToStreamflow,
        isConnected: connected
    }
} 