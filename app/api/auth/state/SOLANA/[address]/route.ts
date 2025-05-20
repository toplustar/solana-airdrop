import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: 'Solana address is required' },
        { status: 400 }
      );
    }

    // Make request to Streamflow API
    const response = await fetch(
      `https://staging-api.streamflow.finance/v2/api/auth/state/SOLANA/${address}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to fetch state', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.text();
    return NextResponse.json({ state: data });
  } catch (error) {
    console.error('Error in Solana state route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
