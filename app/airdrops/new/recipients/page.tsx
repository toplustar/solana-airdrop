"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, X, Users, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import WalletNotConnected from "@/components/wallet-not-connected"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAirdrop } from "@/contexts/airdrop-context"

export default function RecipientsUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { connected } = useWallet()
  const { airdropData, updateFile } = useAirdrop()

  useEffect(() => {
    if (airdropData.file) {
      setFile(airdropData.file)
      setRecipientCount(airdropData.recipientCount)
    }
  }, [airdropData.file, airdropData.recipientCount])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      countRecipients(selectedFile)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      setFile(droppedFile)
      countRecipients(droppedFile)
    }
  }, [])

  const countRecipients = (csvFile: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const lines = content.split("\n").filter(line => line.trim())
      const count = Math.max(0, lines.length - 1)
      setRecipientCount(count)
      updateFile(csvFile, count)
    }
    reader.readAsText(csvFile)
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setRecipientCount(0)
    updateFile(null, 0)
    fileInputRef.current && (fileInputRef.current.value = "")
  }

  const handleNextStep = () => {
    if (file) {
      updateFile(file, recipientCount)
      router.push("/airdrops/new/configuration")
    }
  }

  const downloadSampleCSV = () => {
    const csv = [
      ["Recipient", "Amount"],
      ["9kSXBczGtVeUTRfZnwMpz4mF8d86qjXsPjFb9RkPyJLF", "1"],
      ["9kSXBczGtVeUTRfZnwMpz4mF8d86qjXsPjFb9RkPyJLF", "1"],
    ]
    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "Example_recipients.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!connected) {
    return (
      <div className="container py-6 space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold">Upload Recipients</h1>
        <p className="text-muted-foreground">Upload a CSV file containing the list of recipients for your airdrop.</p>
        <WalletNotConnected />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <h2 className="text-sm font-medium text-muted-foreground">STEP 2</h2>
      <h1 className="text-2xl font-bold">Upload Recipients</h1>
      <p className="text-muted-foreground">Upload a CSV file containing the list of recipients for your airdrop.</p>

      <div
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors min-h-[200px] ${file ? "" : "cursor-pointer"} ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/20"}`}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        tabIndex={file ? -1 : 0}
        role={file ? undefined : "button"}
        aria-label={!file ? "Upload CSV file" : undefined}
        onKeyDown={(e) => {
          if (!file && (e.key === "Enter" || e.key === " ")) fileInputRef.current?.click()
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />

        {file ? (
          <div className="text-center space-y-4 w-full">
            <div className="flex justify-end w-full">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleRemoveFile} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Upload className="h-12 w-12 mb-4 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">File selected:</p>
              <p className="text-primary font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • {new Date().toLocaleDateString()}</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary" className="text-sm">
                  {recipientCount} {recipientCount === 1 ? "Recipient" : "Recipients"}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Upload className="h-12 w-12 mb-4 mx-auto text-muted-foreground" />
            <p className="font-medium">Select a <span className="text-primary">CSV</span> file to upload or drag and drop it here</p>
            <p className="text-sm text-muted-foreground">Your file should include wallet addresses and token amounts</p>
          </div>
        )}
      </div>

      {!file && (
        <div className="bg-secondary/30 rounded-md p-4">
          <h3 className="font-medium mb-2">CSV Format Requirements</h3>
          <p className="text-sm text-muted-foreground mb-2">Your CSV file should have the following columns:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Wallet Address (required)</li>
            <li>Token Amount (required)</li>
          </ul>
          <Button variant="outline" size="sm" className="mt-4" onClick={downloadSampleCSV}>
            <Download className="h-4 w-4 mr-2" />
            Download Example CSV
          </Button>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="outline" asChild>
          <Link href="/airdrops/new/type">Back</Link>
        </Button>
        <Button disabled={!file || recipientCount === 0} onClick={handleNextStep} className="bg-primary hover:bg-primary/90">
          Next Step
        </Button>
      </div>
    </div>
  )
}