"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">Sign In</h1>

        {error && (
          <div className="mb-6 p-4 border border-white/20 bg-white/5 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 mb-4">Or</p>
          <button
            onClick={() => signIn("github")}
            className="w-full px-6 py-3 border border-white/20 hover:border-white/40 transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>

        <div className="mt-8 text-center text-white/60">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

