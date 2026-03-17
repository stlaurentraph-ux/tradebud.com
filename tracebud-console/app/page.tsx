export default function ConsoleHome() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '24px',
        backgroundColor: '#0f172a',
        color: 'white',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Tracebud Console</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Internal dashboard – exporters & importers</div>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Powered by the same API as the offline app.</div>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#020617' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Exporter view</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            See farmers, plots, vouchers, and Due Diligence Statement (DDS) packages built from the offline app.
          </p>
          <ul style={{ fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
            <li>List DDS packages with Green / Amber / Red compliance signals.</li>
            <li>Open a package to see underlying plots and harvests.</li>
            <li>Download a TRACES-style DDS JSON snapshot.</li>
          </ul>
        </div>

        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#020617' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Importer / roaster view</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            Read-only window into the same DDS packages, ready to map to TRACES NT, ESG systems, or carbon registries.
          </p>
          <ul style={{ fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
            <li>Verify origin plots and their compliance status.</li>
            <li>Inspect legally relevant metadata (FPIC, labor, overlaps).</li>
            <li>Reuse existing TRACES reference numbers instead of duplicating work.</li>
          </ul>
        </div>

        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#020617' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Implementation status</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            The console will connect to the existing NestJS backend you are building in this repo.
          </p>
          <ul style={{ fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
            <li>API already exposes plots, vouchers, DDS packages, and TRACES-style JSON.</li>
            <li>Next steps: build authenticated pages that call those endpoints.</li>
            <li>Deploy this app via Vercel with root directory set to <code>tracebud-console</code>.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

