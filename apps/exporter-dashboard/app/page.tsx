"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { PackagesTable, type DdsPackage } from "@/components/dashboard/packages-table";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Charts } from "@/components/dashboard/charts";
import { LoginForm } from "@/components/auth/login-form";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase URL or ANON key not configured for exporter console."
    );
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export default function DashboardPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [packages, setPackages] = useState<DdsPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPackages: 0,
    pendingPackages: 0,
    totalPlots: 0,
    totalFarmers: 0,
  });

  // Check for existing session on mount
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const checkSession = async () => {
      try {
        const client = getSupabase();
        const { data } = await client.auth.getSession();
        if (data.session) {
          setAccessToken(data.session.access_token);
          setUserEmail(data.session.user.email ?? null);
        }
      } catch (error) {
        console.log("[v0] No existing session found");
      }
    };
    checkSession();
  }, []);

  // Load packages when authenticated
  const loadPackages = useCallback(async () => {
    if (!accessToken) return;

    setLoadingPackages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/harvest/packages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log("[v0] Failed to load packages:", body.message);
        setPackages([]);
        return;
      }
      const rows = await res.json();
      setPackages(rows ?? []);

      // Update metrics based on packages
      const pending = rows?.filter(
        (p: DdsPackage) => p.status === "pending"
      ).length;
      setMetrics((prev) => ({
        ...prev,
        totalPackages: rows?.length ?? 0,
        pendingPackages: pending ?? 0,
      }));
    } catch (error) {
      console.log("[v0] Error loading packages:", error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadPackages();
    }
  }, [accessToken, loadPackages]);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const client = getSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) {
        setAuthError(error?.message ?? "Login failed.");
        setAccessToken(null);
        return;
      }
      setAccessToken(data.session.access_token);
      setUserEmail(data.session.user.email ?? null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not contact Supabase.";
      setAuthError(message);
      setAccessToken(null);
    }
  };

  const handleLogout = async () => {
    try {
      const client = getSupabase();
      await client.auth.signOut();
    } catch (error) {
      console.log("[v0] Error signing out:", error);
    }
    setAccessToken(null);
    setUserEmail(null);
    setPackages([]);
  };

  // Show configuration notice if Supabase is not set up
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Configuration Required</h1>
          <p className="text-sm text-muted-foreground">
            Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
            your environment to enable the exporter dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!accessToken) {
    return <LoginForm onLogin={handleLogin} error={authError} />;
  }

  // Show dashboard
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title="Overview"
          subtitle={`Welcome back${userEmail ? ", " + userEmail.split("@")[0] : ""}`}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            {/* Charts */}
            <Charts />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Packages Table - takes 2 columns */}
              <div className="lg:col-span-2">
                <PackagesTable
                  packages={packages}
                  loading={loadingPackages}
                  onViewPackage={(id) =>
                    console.log("[v0] View package:", id)
                  }
                  onSubmitToTraces={(id) =>
                    console.log("[v0] Submit to TRACES:", id)
                  }
                />
              </div>

              {/* Sidebar widgets */}
              <div className="space-y-6">
                <QuickActions
                  onNewPackage={() => console.log("[v0] New package")}
                  onImportData={() => console.log("[v0] Import data")}
                  onVerifyPlots={() => console.log("[v0] Verify plots")}
                  onExportReport={() => console.log("[v0] Export report")}
                />
                <ActivityFeed />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
