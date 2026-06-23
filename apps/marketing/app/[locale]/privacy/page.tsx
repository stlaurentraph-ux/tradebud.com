import type { ReactNode } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tracebud',
  description:
    'How Tracebud collects, uses, stores, and protects personal data across our website, mobile field app, and compliance platform.',
}

type Props = {
  params: Promise<{ locale: string }>
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">{children}</div>
    </section>
  )
}

export default async function PrivacyPolicy({ params }: Props) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--forest-light)] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${locale}`}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/80 text-lg">Last updated: June 16, 2026</p>
          <p className="text-white/70 text-base mt-3 max-w-2xl">
            This policy explains how Tracebud handles personal data when you use our website, mobile field app,
            and compliance dashboards.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none space-y-10">
          <Section title="1. Who we are">
            <p>
              Tracebud (&quot;Tracebud&quot;, &quot;we&quot;, &quot;us&quot;) provides supply-chain traceability and
              EU Deforestation Regulation (EUDR) compliance tools for farmers, cooperatives, exporters, and buyers.
            </p>
            <p>
              For privacy questions or to exercise your rights, contact{' '}
              <a href="mailto:privacy@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                privacy@tracebud.com
              </a>
              .
            </p>
          </Section>

          <Section title="2. What this policy covers">
            <p>This policy applies to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>tracebud.com</strong> — marketing site, waitlist, and product information
              </li>
              <li>
                <strong>Tracebud mobile field app</strong> — offline-first plot mapping, land papers, harvest
                deliveries, and producer documents
              </li>
              <li>
                <strong>Tracebud web dashboards</strong> — cooperative, exporter, and buyer compliance workflows
              </li>
            </ul>
            <p>
              Some organizations use Tracebud under their own account. When a cooperative or exporter invites you,
              they may also have policies that apply to your relationship with them. Tracebud processes data on their
              instructions only within the access you approve.
            </p>
          </Section>

          <Section title="3. Data we collect">
            <p>Depending on how you use Tracebud, we may process:</p>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Account and identity</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Name, email address, phone number (if provided)</li>
                  <li>Organization name, role, and country</li>
                  <li>Authentication identifiers and session tokens</li>
                  <li>Language and app preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Farm and plot data (field app)</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Plot names, boundaries, area estimates, and commodity information</li>
                  <li>GPS coordinates captured while mapping or photographing plots</li>
                  <li>Field photos used for ground-truth and evidence</li>
                  <li>Harvest weights, delivery records, and traceability codes</li>
                  <li>Producer declarations (for example deforestation-free statements)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Land documents and evidence</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Photos and PDFs of land titles, leases, possession letters, permits, and related papers</li>
                  <li>Cadastral or registry identifiers you enter</li>
                  <li>Structured fields extracted from documents during automated review (see Section 5)</li>
                  <li>FPIC, labor, and other compliance documents uploaded by producers or cooperatives</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Compliance and shipment data (dashboards)</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Due diligence records, audit events, and regulatory submission references</li>
                  <li>Supplier and customer relationship metadata</li>
                  <li>Reviewer notes and workflow status</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Website and technical data</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>IP address, browser type, device type, and pages visited</li>
                  <li>Cookie and analytics data (with your consent where required)</li>
                  <li>Crash reports and performance diagnostics when enabled</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section title="4. How we collect data">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Directly from you</strong> — when you register, map plots, upload documents, record deliveries,
                or change settings
              </li>
              <li>
                <strong>On your device</strong> — the field app stores data locally first; it syncs when you sign in
                and choose to back up
              </li>
              <li>
                <strong>From organizations you work with</strong> — for example when a cooperative links your
                producer profile, subject to consent rules in the platform
              </li>
              <li>
                <strong>Automatically</strong> — server logs, security monitoring, and optional analytics
              </li>
            </ul>
          </Section>

          <Section title="5. Land documents and automated checks">
            <p>
              When you upload land papers in the field app, Tracebud may run an <strong>automated document check</strong>{' '}
              to confirm the file looks like a valid land title, lease, or possession letter, and to extract key fields
              (such as holder name or registry reference) for compliance workflows.
            </p>
            <p>
              <strong>How automated checks treat your file:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                The check is used only to validate and process your upload — not to build a public profile about you
              </li>
              <li>
                We configure our AI providers, where supported, with <strong>zero data retention</strong> and{' '}
                <strong>no training on your prompts or documents</strong> for these checks
              </li>
              <li>
                The automated system does not &quot;remember&quot; your document in a personal AI memory separate from
                your Tracebud account
              </li>
              <li>
                A human reviewer at your cooperative or exporter may still review unclear cases before export approval
              </li>
            </ul>
            <p>
              <strong>What we keep after the check:</strong> your original file (photo or PDF) and a structured summary
              of the review outcome (for example accepted, needs clearer photo, or registry mismatch). These are stored
              in your Tracebud account under the same security and access rules as your other farm data.
            </p>
            <p>
              If a file cannot be read, we will ask you to upload a clearer copy. We do not use failed uploads for
              unrelated marketing or advertising.
            </p>
          </Section>

          <Section title="6. How we use your data">
            <p>We use personal data to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide plot mapping, document storage, harvest logging, and traceability features</li>
              <li>Run compliance checks required for EUDR and buyer due diligence</li>
              <li>Sync data between your device and your organization&apos;s Tracebud workspace</li>
              <li>Authenticate users and prevent fraud or abuse</li>
              <li>Respond to support requests and improve product reliability</li>
              <li>Meet legal, tax, and regulatory obligations</li>
              <li>Send service-related messages (not unrelated third-party marketing)</li>
            </ul>
            <p>
              <strong>We do not sell your personal data.</strong> Tracebud is not a data broker. We do not rent farm
              data to advertisers or unrelated third parties.
            </p>
          </Section>

          <Section title="7. Legal bases (EEA / UK)">
            <p>If you are in the European Economic Area or United Kingdom, we rely on one or more of the following:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Contract</strong> — to provide the service you or your organization signed up for
              </li>
              <li>
                <strong>Legitimate interests</strong> — to secure the platform, prevent abuse, and improve reliability,
                balanced against your rights
              </li>
              <li>
                <strong>Legal obligation</strong> — to retain certain compliance and audit records where law requires
              </li>
              <li>
                <strong>Consent</strong> — for optional cookies, certain sharing choices, and where consent is required
                by law
              </li>
            </ul>
          </Section>

          <Section title="8. Who can see your data">
            <p>
              <strong>You control sharing.</strong> In the field app, cooperatives and buyers only receive access to
              your plots, deliveries, and documents when you (or your organization&apos;s policy) grant it. You can
              review and revoke access in Data sharing settings where available.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Farmers / producers</strong> — own their farm-origin data; can export a personal copy and
                manage sharing grants
              </li>
              <li>
                <strong>Cooperatives</strong> — see member data only within active sourcing and consent relationships
              </li>
              <li>
                <strong>Exporters and buyers</strong> — see supplier data only for compliance and shipments you are
                linked to
              </li>
              <li>
                <strong>Tracebud staff</strong> — limited access for support, security, and operations under internal
                controls
              </li>
              <li>
                <strong>Sub-processors</strong> — infrastructure and service providers listed in Section 13
              </li>
            </ul>
          </Section>

          <Section title="9. Your data ownership">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Farmers own their farm data.</strong> Plots, photos, GPS boundaries, and documents you capture
                belong to you. You can download copies where the product provides export.
              </li>
              <li>
                <strong>Cooperatives own their operational records</strong> about members, subject to member rights and
                applicable law.
              </li>
              <li>
                <strong>Exporters and importers own their shipment and due diligence records</strong> created in their
                workspace.
              </li>
            </ul>
            <p>
              Leaving Tracebud does not automatically delete records that your cooperative or buyer must keep for legal
              compliance — see Section 11.
            </p>
          </Section>

          <Section title="10. Your rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access a copy of your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete data or request erasure</li>
              <li>Restrict or object to certain processing</li>
              <li>Data portability</li>
              <li>Withdraw consent where processing is consent-based</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
            <p>
              In the field app, use <strong>Settings → Data sharing</strong> to manage access, export a personal JSON
              backup, or submit a deletion request. You can also email{' '}
              <a href="mailto:privacy@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                privacy@tracebud.com
              </a>
              . We respond within the timeframes required by applicable law.
            </p>
          </Section>

          <Section title="11. Retention">
            <p>We keep data only as long as needed for the purposes above, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Active accounts</strong> — while your account or organization subscription is active and you
                use the service
              </li>
              <li>
                <strong>Compliance and audit records</strong> — up to <strong>five (5) years</strong> or longer where
                linked to submitted due diligence or regulatory filings, as required by law
              </li>
              <li>
                <strong>Evidence documents</strong> — for the retention period tied to the plot, shipment, or audit
                event they support
              </li>
              <li>
                <strong>Marketing site analytics</strong> — according to cookie settings and analytics provider defaults
              </li>
            </ul>
            <p>
              When you request erasure, we apply <strong>cryptographic shredding</strong> for identifiable personal
              fields where possible. Records that must remain for legal compliance (for example an accepted DDS
              reference or immutable audit log) may be retained in redacted or pseudonymized form so regulatory
              obligations are met without unnecessary ongoing identification.
            </p>
          </Section>

          <Section title="12. Security">
            <p>We use technical and organizational measures appropriate to the sensitivity of compliance data, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Encryption in transit (TLS) for data sent between your device and our servers</li>
              <li>Encrypted storage with our cloud infrastructure providers</li>
              <li>Role-based access controls and tenant isolation between organizations</li>
              <li>Audit logging for compliance-relevant actions</li>
              <li>Monitoring for abuse and unauthorized access</li>
            </ul>
            <p>
              No method of transmission or storage is 100% secure. If you believe your account has been compromised,
              contact{' '}
              <a href="mailto:privacy@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                privacy@tracebud.com
              </a>{' '}
              immediately.
            </p>
          </Section>

          <Section title="13. Sub-processors and international transfers">
            <p>We use trusted service providers to host and operate Tracebud, such as:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Cloud hosting and database providers</li>
              <li>Authentication and storage services</li>
              <li>Email delivery</li>
              <li>Error monitoring (when enabled in production)</li>
              <li>AI gateway providers for document checks (with privacy controls described in Section 5)</li>
            </ul>
            <p>
              Providers process data only on our instructions and under contractual safeguards. If data is transferred
              outside your country, we use appropriate mechanisms (such as Standard Contractual Clauses) where required.
            </p>
          </Section>

          <Section title="14. Cookies and analytics (website)">
            <p>
              Our marketing website may use cookies and similar technologies for essential functionality, preferences,
              and — with your consent where required — analytics to understand how visitors use tracebud.com. You can
              manage cookie choices in the cookie banner. See our cookie notice for details on specific tools in use.
            </p>
            <p>The mobile field app does not use advertising cookies.</p>
          </Section>

          <Section title="15. Children">
            <p>
              Tracebud is a business and compliance platform. It is not directed at children under 16. We do not
              knowingly collect personal data from children. If you believe a child has provided data, contact us and
              we will delete it where appropriate.
            </p>
          </Section>

          <Section title="16. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. We will post the new version on this page and update
              the &quot;Last updated&quot; date. For material changes, we may notify you by email or in-app notice where
              appropriate.
            </p>
          </Section>

          <section className="bg-muted/50 p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact us</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Privacy requests:{' '}
              <a href="mailto:privacy@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                privacy@tracebud.com
              </a>
              <br />
              General support:{' '}
              <a href="mailto:support@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
                support@tracebud.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
