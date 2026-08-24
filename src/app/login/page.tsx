"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 rounded-lg btn-chrome font-extrabold text-lg tracking-tight mb-3">
            J-GAARD
          </div>
          <h1 className="text-xl font-semibold text-navy">Dispatch</h1>
          <p className="text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-surface rounded-xl p-6 space-y-4 shadow-lg"
        >
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card-2 border border-line rounded-lg px-3 py-2.5 text-ink outline-none focus:border-steel"
              placeholder="you@jgaard.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card-2 border border-line rounded-lg px-3 py-2.5 text-ink outline-none focus:border-steel"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red text-sm bg-red/10 border border-red/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-chrome font-bold text-sm rounded-lg py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-muted text-xs mt-6">
          Accounts are created by an owner in Admin — contact Jordan or Jeremy if you need access.
        </p>
      </div>
    </div>
  );
}
