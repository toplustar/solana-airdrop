import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sid = formData.get("sid") as string;
    const mint = formData.get("mint") as string;
    const name = formData.get("name") as string;
    const file = formData.get("file") as File;

    const textPreview = await file.text();
console.log("===== CSV PREVIEW =====\n" + textPreview);


    const uploadForm = new FormData();
    uploadForm.append("mint", mint);
    uploadForm.append("name", name);
    uploadForm.append("file", file, "blob");
    console.log(uploadForm, "uploadForm")

    const response = await fetch("https://staging-api.streamflow.finance/v2/api/airdrops/", {
      method: "POST",
      headers: {
        Cookie: `sid=${sid}` 
      },
      body: uploadForm,
    });
    console.log(response, "response")
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
