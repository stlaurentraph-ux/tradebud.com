'use client';

import { useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or ANON key not configured for exporter console.');
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export default function ConsoleHome() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [farmerId, setFarmerId] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '24px',
        backgroundColor: '#020617',
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
            <div style={{ fontSize: 20, fontWeight: 600 }}>Tracebud Exporter Console</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Early preview – wired to your existing backend.</div>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Backed by the same NestJS API as the offline app.</div>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        }}
      >
        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#0f172a' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>DDS packages</h2>
          {!SUPABASE_URL || !SUPABASE_ANON_KEY ? (
            <p style={{ fontSize: 13, color: '#fecaca' }}>
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment to enable exporter
              login.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
                Log in with an <strong>exporter</strong> Supabase account, then load DDS packages for a farmer.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Exporter email</div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exporter@example.com"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid #374151',
                      backgroundColor: '#020617',
                      color: 'white',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid #374151',
                      backgroundColor: '#020617',
                      color: 'white',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setAuthError(null);
                  setPackagesError(null);
                  try {
                    const client = getSupabase();
                    const { data, error } = await client.auth.signInWithPassword({
                      email: email.trim(),
                      password,
                    });
                    if (error || !data.session) {
                      setAuthError(error?.message ?? 'Login failed.');
                      setAccessToken(null);
                      return;
                    }
                    setAccessToken(data.session.access_token);
                  } catch (e: any) {
                    setAuthError(e?.message ?? 'Could not contact Supabase.');
                    setAccessToken(null);
                  }
                }}
                style={{
                  marginTop: 4,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: '#22c55e',
                  color: '#022c22',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {accessToken ? 'Exporter logged in' : 'Log in as exporter'}
              </button>
              {authError && (
                <p style={{ fontSize: 12, color: '#fecaca', marginTop: 4 }}>{authError}</p>
              )}

              <hr style={{ borderColor: '#1f2937', margin: '12px 0' }} />

              <div style={{ marginBottom: 8, fontSize: 13 }}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Farmer ID to view packages for</div>
                <input
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  placeholder="UUID of farmer_profile"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #374151',
                    backgroundColor: '#020617',
                    color: 'white',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  disabled={!accessToken || !farmerId.trim() || loadingPackages}
                  onClick={async () => {
                    if (!accessToken || !farmerId.trim()) return;
                    setLoadingPackages(true);
                    setPackagesError(null);
                    try {
                      const res = await fetch(
                        `${API_BASE_URL}/v1/harvest/packages?farmerId=${encodeURIComponent(
                          farmerId.trim(),
                        )}`,
                        {
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                            accept: 'application/json',
                          },
                        },
                      );
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        setPackages([]);
                        setPackagesError(body.message ?? `Backend responded with ${res.status}`);
                        return;
                      }
                      const rows = await res.json();
                      setPackages(rows ?? []);
                    } catch (e: any) {
                      setPackages([]);
                      setPackagesError(e?.message ?? 'Could not reach backend.');
                    } finally {
                      setLoadingPackages(false);
                    }
                  }}
                  style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: !accessToken || !farmerId.trim() ? '#4b5563' : '#38bdf8',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: !accessToken || !farmerId.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingPackages ? 'Loading packages…' : 'Load DDS packages'}
                </button>
              </div>

              {packagesError && (
                <p style={{ fontSize: 12, color: '#fecaca', marginBottom: 8 }}>
                  {packagesError}
                </p>
              )}

              {packages.length === 0 && !packagesError ? (
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  No DDS packages yet. Record harvests in the offline app and bundle vouchers there to see them appear
                  here.
                </p>
              ) : null}

              {packages.length > 0 && (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid '#1f2937' }}>
                      <th style={{ padding: '6px 4px' }}>ID</th>
                      <th style={{ padding: '6px 4px' }}>Status</th>
                      <th style={{ padding: '6px 4px' }}>TRACES ref</th>
                      <th style={{ padding: '6px 4px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #111827' }}>
                        <td style={{ padding: '6px 4px' }}>{String(p.id).slice(0, 8)}…</td>
                        <td style={{ padding: '6px 4px' }}>{p.status}</td>
                        <td style={{ padding: '6px 4px' }}>{p.traces_reference ?? '—'}</td>
                        <td style={{ padding: '6px 4px' }}>
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#020617' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>What this console will do</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            This app is designed as the desktop companion to the offline farmer app:
          </p>
          <ul style={{ fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
            <li>Exporters: track incoming DDS packages and trigger TRACES submissions.</li>
            <li>Importers / roasters: verify origin plots, FPIC & labor flags, and overlaps.</li>
            <li>All views are powered by the same NestJS/PostGIS backend already running locally.</li>
          </ul>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 12 }}>
            Next step: wire Supabase Auth here so exporters can log in with the same accounts you use in the mobile
            app, then replace the placeholder call above with authenticated requests.
          </p>
        </div>
      </section>
    </main>
  );
}

