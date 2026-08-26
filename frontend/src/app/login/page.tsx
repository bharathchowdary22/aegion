"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Optionally show success or redirect
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      
      router.push("/");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 items-center justify-center text-gray-100">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center tracking-wide">AEGION</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 outline-none focus:border-blue-500"
              placeholder="user@example.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <div className="pt-2 flex flex-col gap-3">
            <button 
              onClick={() => handleAuth(false)}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button 
              onClick={() => handleAuth(true)}
              disabled={loading}
              className="w-full bg-transparent hover:bg-gray-800 border border-gray-700 text-gray-300 font-medium py-2 rounded transition-colors disabled:opacity-50"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
