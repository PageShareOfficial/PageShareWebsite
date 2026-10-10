export default function AuthErrorBanner({ message }: Readonly<{ message: string | null }>) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      {message}
    </div>
  );
}
