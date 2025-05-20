import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
      const formData = await request.formData();
  
      const mint = formData.get("mint") as string;
      const name = formData.get("name") as string;
      const file = formData.get("file") as Blob; 
  
      const uploadForm = new FormData();
      uploadForm.append("mint", mint);
      uploadForm.append("name", name);
      uploadForm.append("file", file); 
  
      const response = await fetch("https://staging-api.streamflow.finance/v2/api/airdrops/", {
        method: "POST",
        body: uploadForm,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        return NextResponse.json({ error: data.message || 'Failed to create airdrop' }, { status: response.status });
      }
  
      return NextResponse.json(data);
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  