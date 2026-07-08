import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ShowAllButtonProps {
  href: string;
  label?: string;
}

export default function ShowAllButton({ href, label = 'Show all' }: ShowAllButtonProps) {
  return (
    <div className="flex justify-center">
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}
