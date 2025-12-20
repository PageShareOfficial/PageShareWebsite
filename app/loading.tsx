export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-white/10 rounded mb-4"></div>
        <div className="h-4 w-48 bg-white/10 rounded"></div>
      </div>
    </div>
  );
}

