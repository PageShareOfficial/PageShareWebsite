import Link from 'next/link';

interface SignUpTermsNoticeProps {
  className?: string;
}

export default function SignUpTermsNotice({ className = '' }: SignUpTermsNoticeProps) {
  return (
    <p className={`text-[11px] sm:text-xs text-gray-500 leading-relaxed ${className}`}>
      By signing up to PageShare you are accepting our{' '}
      <Link href="/privacy" className="text-cyan-400/90 hover:text-cyan-300 hover:underline">
        Privacy Policy
      </Link>{' '}
      &amp;{' '}
      <Link href="/terms" className="text-cyan-400/90 hover:text-cyan-300 hover:underline">
        Terms and Conditions
      </Link>
      .
    </p>
  );
}
