'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Waitlist() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would implement actual waitlist signup logic
    console.log('Join waitlist:', { email });
    
    setIsLoading(false);
    setIsSubmitted(true);
    
    // Optionally redirect after a delay
    // setTimeout(() => router.push('/'), 3000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <nav className="border-b border-white/10 bg-black">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="group hover:opacity-80 transition-opacity">
                <Logo size={40} />
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <div className="w-full max-w-md text-center">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">You're on the list!</h1>
              <p className="text-gray-400 mb-8">
                We'll notify you when PageShare is ready. Check your email for confirmation.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full text-white font-bold hover:from-teal-600 hover:to-cyan-600 hover:scale-105 transition-all"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="border-b border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="group hover:opacity-80 transition-opacity">
              <Logo size={40} />
            </Link>
            <Link
              href="/"
              className="px-6 py-2 bg-transparent border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Join the waitlist</h1>
              <p className="text-gray-400 text-sm">Be among the first to access PageShare</p>
            </div>

            <form onSubmit={handleJoinWaitlist} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full text-white font-bold hover:from-teal-600 hover:to-cyan-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By joining, you agree to receive updates about PageShare
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

