import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: Request,
  { params }: { params: { airdropId: string } }
) {
  try {
    const { airdropId } = params;
    
    const response = await axios.get(
      `https://staging-api.streamflow.finance/v2/api/airdrops/${airdropId}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching airdrop data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airdrop data' },
      { status: 500 }
    );
  }
} 