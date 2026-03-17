"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { LeadFormDialog } from "@/components/lead-form-dialog"

const LeadFormContext = createContext<{ openForm: () => void }>({
  openForm: () => {},
})

export function useLeadForm() {
  return useContext(LeadFormContext)
}

export function LeadFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <LeadFormContext.Provider value={{ openForm: () => setOpen(true) }}>
      {children}
      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </LeadFormContext.Provider>
  )
}
