import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { airdropId: string; address: string } }
) {
  const { airdropId, address } = params

  const res = await fetch(
    `https://staging-api.streamflow.finance/v2/api/airdrops/${airdropId}/claimants/${address}`
  )

  const data = await res.json()

  return NextResponse.json(data)
}