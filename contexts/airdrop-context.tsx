"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"

interface AirdropData {
  type: string | null
  file: File | null
  recipientCount: number
  title: string
  token: string
  tokenDecimals: number
  startUponCreation: boolean
  cancellable: boolean
  claimOnce: boolean
  // Add new vesting configuration fields
  distributionEndDate: Date | null
  distributionEndTime: string
  distributerStartTime: Date | null
  unlockInterval: string
}

interface AirdropContextType {
  airdropData: AirdropData
  updateAirdropType: (type: string) => void
  updateFile: (file: File | null, recipientCount: number) => void
  updateConfiguration: (config: Partial<AirdropData>) => void
  resetAirdropData: () => void
}

const defaultAirdropData: AirdropData = {
  type: "instant",
  file: null,
  recipientCount: 0,
  title: "",
  token: "",
  tokenDecimals: 9,
  startUponCreation: true,
  cancellable: false,
  claimOnce: true,
  // Initialize new vesting configuration fields
  distributionEndDate: null,
  distributionEndTime: "12:00",
  distributerStartTime: null,
  unlockInterval: "1",
}

const AirdropContext = createContext<AirdropContextType>({
  airdropData: defaultAirdropData,
  updateAirdropType: () => {},
  updateFile: () => {},
  updateConfiguration: () => {},
  resetAirdropData: () => {},
})

export const useAirdrop = () => useContext(AirdropContext)

interface AirdropProviderProps {
  children: ReactNode
}

export const AirdropProvider: React.FC<AirdropProviderProps> = ({ children }) => {
  const [airdropData, setAirdropData] = useState<AirdropData>(defaultAirdropData)

  const updateAirdropType = (type: string) => {
    setAirdropData((prev) => ({ ...prev, type }))
  }

  const updateFile = (file: File | null, recipientCount: number) => {
    setAirdropData((prev) => ({ ...prev, file, recipientCount }))
  }

  const updateConfiguration = (config: Partial<AirdropData>) => {
    setAirdropData((prev) => ({ ...prev, ...config }))
  }

  const resetAirdropData = () => {
    setAirdropData(defaultAirdropData)
  }

  return (
    <AirdropContext.Provider
      value={{
        airdropData,
        updateAirdropType,
        updateFile,
        updateConfiguration,
        resetAirdropData,
      }}
    >
      {children}
    </AirdropContext.Provider>
  )
}
