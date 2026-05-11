import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Tracebud',
  description: 'Tracebud terms of service - terms and conditions for using our platform.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--forest-light)] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/80 text-lg">Last updated: May 8, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              By accessing and using the Tracebud website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">2. Use License</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on Tracebud&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">3. Disclaimer</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The materials on Tracebud&apos;s website are provided on an &apos;as is&apos; basis. Tracebud makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">4. Limitations</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              In no event shall Tracebud or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Tracebud&apos;s website.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">5. Accuracy of Materials</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The materials appearing on Tracebud&apos;s website could include technical, typographical, or photographic errors. Tracebud does not warrant that any of the materials on its website are accurate, complete, or current. Tracebud may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">6. Links</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Tracebud has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Tracebud of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">7. Modifications</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Tracebud may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">8. Governing Law</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of the European Union, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="bg-muted/50 p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Questions?</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                legal@tracebud.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
