"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AirdropTable from "@/components/airdrop-table"
import ClaimTable from "@/components/claim-table"
import UnconnectedState from "@/components/unconnected-state"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import AirdropSearch from "@/components/airdrop-search"

export default function AirdropsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { connected } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const tab = searchParams.get("tab") || "claimable"


  const handleTabChange = (value: string) => {
    router.push(`/airdrops?tab=${value}`)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <AirdropSearch />
        {mounted && connected ? (
          <Button asChild>
            <Link href="/airdrops/new/type">Create New</Link>
          </Button>
        ) : mounted ? (
          <></>
        ) : null}
      </div>

      {mounted && connected ? (
        <>
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="claimable">Claimable</TabsTrigger>
              <TabsTrigger value="created">Created</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "claimable" ? (
            <ClaimTable />
          ) : (
            <AirdropTable />
          )}
        </>
      ) : (
        <UnconnectedState />
      )}
    </div>
  )
}
