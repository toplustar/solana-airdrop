import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import SolanaProvider from "@/providers/SolanaProvider"
import { AirdropProvider } from "@/contexts/airdrop-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Airflux",
  description: "A dashboard for managing airdrops",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SolanaProvider>
            <AirdropProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </AirdropProvider>
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
