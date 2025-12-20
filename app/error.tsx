"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-serif mb-4">Something went wrong!</h2>
        <button
          onClick={reset}
          className="px-6 py-2 border border-white/20 hover:border-white/40 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

