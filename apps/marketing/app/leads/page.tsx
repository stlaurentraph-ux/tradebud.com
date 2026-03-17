"use client"

import { useState } from "react"
import { LeadFormDialog } from "@/components/lead-form-dialog"

export default function LeadsPage() {
  const [open, setOpen] = useState(true)

  return (
    <main className="min-h-screen bg-stone-50 text-emerald-900 flex items-center justify-center px-4">
      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </main>
  )
}

