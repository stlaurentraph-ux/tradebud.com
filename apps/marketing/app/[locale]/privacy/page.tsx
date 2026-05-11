import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tracebud',
  description: 'Tracebud privacy policy - how we handle your data and protect your privacy.',
}

export default function PrivacyPolicy() {
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
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/80 text-lg">Last updated: May 8, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Tracebud (&quot;we&quot;, &quot;us&quot;, &quot;our&quot; or &quot;Company&quot;) operates the tracebud.com website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">Information Collection and Use</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Types of Data Collected:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Email address</li>
                  <li>First and last name</li>
                  <li>Phone number</li>
                  <li>Organization and role information</li>
                  <li>Commodity preferences and producer information</li>
                  <li>Usage data and analytics</li>
                  <li>Device information (IP address, browser type, etc.)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">Use of Data</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Tracebud uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">Security of Data</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">GDPR Compliance</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              If you are located in the European Economic Area (EEA), you have certain data protection rights. Tracebud aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-foreground mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;effective date&quot; at the top of this Privacy Policy.
            </p>
          </section>

          <section className="bg-muted/50 p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                privacy@tracebud.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
