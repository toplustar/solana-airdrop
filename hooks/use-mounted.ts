"use client"

import { useEffect, useState } from "react"

// This hook helps prevent hydration errors by only returning true when the component is mounted
export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
