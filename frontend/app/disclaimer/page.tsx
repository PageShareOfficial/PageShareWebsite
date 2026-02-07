import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'PageShare disclaimer. Important information about content on our social platform for stocks, NFTs and crypto. Not financial advice.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-block">
            <Image src="/pageshare_final.png" alt="PageShare Logo" width={40} height={40} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-4xl sm:text-5xl font-black mb-8">Disclaimer</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Not Financial Advice</h2>
            <p>
              PageShare is a social platform for discussing stocks, ETFs, crypto, and NFTs. We are not a securities broker-dealer, investment adviser, or any other type of financial professional. No content on the PageShare platform — including posts, comments, news summaries, or ticker information — should be considered an offer, solicitation of an offer, or advice to buy or sell securities or any other investment or financial product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. User-Generated Content</h2>
            <p>
              All opinions, analysis, and content shared on PageShare are those of the individual users who post them. PageShare does not endorse, verify, or guarantee the accuracy of any user-generated content. Any mention of specific securities, tokens, or investments does not constitute a recommendation. You should not rely on content on this platform as the basis for any investment decision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Market Data & Third-Party Information</h2>
            <p>
              Market data, charts, news, and ticker information displayed on PageShare are sourced from third-party providers and may be delayed or incomplete. We do not guarantee the accuracy, completeness, or timeliness of any market data. Always verify information through official or primary sources before making any financial decision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Crypto, NFTs & High-Risk Assets</h2>
            <p>
              Cryptocurrencies, NFTs, and other digital assets are highly volatile and involve significant risk. Prices can fluctuate dramatically, and you may lose some or all of your investment. Regulatory treatment of crypto and NFTs varies by jurisdiction and may change. Discussion of these assets on PageShare does not imply suitability for any particular investor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Do Your Own Research</h2>
            <p>
              You are solely responsible for your investment decisions. Before buying, selling, or holding any security or asset, you should conduct your own research and, if appropriate, consult a licensed financial adviser. Past performance is not indicative of future results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. No Professional Relationship</h2>
            <p>
              By using PageShare, you understand and agree that we do not provide investment advice, recommend any security, transaction, or order, issue securities, or produce or provide research. No fiduciary or advisory relationship is created between you and PageShare by virtue of your use of the platform.
            </p>
          </section>

          <section>
            <p className="text-gray-400 text-sm">
              If you have questions about this disclaimer, please review our{' '}
              <Link href="/terms" className="text-teal-400 hover:text-teal-300 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
