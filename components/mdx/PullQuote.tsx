interface PullQuoteProps {
  children: React.ReactNode;
}

export function PullQuote({ children }: PullQuoteProps) {
  return (
    <blockquote className="my-12 py-8 border-t border-b border-white/20 text-2xl font-serif italic text-center text-white/90">
      {children}
    </blockquote>
  );
}

