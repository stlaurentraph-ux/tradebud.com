"use client";

import { useContext, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AlertTriangle, Loader2 } from "lucide-react";
import { LocaleContext } from "@/lib/locale-context";
import { getAuthCopy } from "@/lib/workflow-terminology-labels";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error?: string | null;
}

export function LoginForm({ onLogin, error }: LoginFormProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">T</span>
          </div>
          <CardTitle className="text-2xl">{getAuthCopy("welcome_back", t)}</CardTitle>
          <CardDescription>{getAuthCopy("legacy_login_subtitle", t)}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {getAuthCopy("field_email", t)}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="exporter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {getAuthCopy("field_password", t)}
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showPasswordLabel={getAuthCopy('show_password', t)}
                hidePasswordLabel={getAuthCopy('hide_password', t)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {getAuthCopy("signing_in", t)}
                </>
              ) : (
                getAuthCopy("sign_in", t)
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">{getAuthCopy("legacy_login_hint", t)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
