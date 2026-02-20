import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Linkedin } from 'lucide-react';
import { siteConfig } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name} — our mission, founder, and vision for financial literacy and community.`,
  openGraph: {
    title: `About | ${siteConfig.name}`,
    description: `About ${siteConfig.name} — our mission, founder, and vision for financial literacy and community.`,
    url: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
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
        <h1 className="text-4xl sm:text-5xl font-black mb-8">About</h1>
        <p className="text-sm text-gray-400 mb-8">
          {siteConfig.name} — mission, founder, and vision
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* About PageShare — 3 paragraphs */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">About PageShare</h2>
            <p className="mb-4">
              {siteConfig.name} is a social platform for sharing thoughts and ideas about stock
              markets, NFTs, and crypto. We built a place where you can post, follow tickers,
              discover news, and learn from others — without the noise. The feed is organized
              around tickers and categories so you can explore discussions, react, comment,
              repost, and bookmark.
            </p>
            <p className="mb-4">
              Labs brings experimental AI tools so you can try new ways to explore the market and
              the community. Whether you&apos;re learning the basics or sharing your own analysis,{' '}
              {siteConfig.name} is designed to help you connect and stay informed.
            </p>
            <p>
              We&apos;re here to make market conversations accessible, transparent, and useful
              for everyone.
            </p>
          </section>

          {/* Founder */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Founder</h2>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Link
                href="https://www.linkedin.com/in/rahul-naik-rk918/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full overflow-hidden border-2 border-slate-400 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                aria-label="Rahul Naik on LinkedIn"
              >
                <Image
                  src="/linkedin_photo.png"
                  alt="Rahul Naik"
                  width={240}
                  height={240}
                  className="object-cover w-240 h-240"
                />
              </Link>
              <div className="space-y-2 min-w-0">
                <p className="text-white font-medium">Rahul Naik</p>
                <p className="text-gray-300">
                  Rahul is the founder of {siteConfig.name} and a multi-domain expert with
                  expertise in software development, AI, analytics &amp; quantitative finance. He
                  is CTO of Martian Data, a business consultancy. An alumnus of the Indian Institute
                  of Technology Jodhpur, he is deeply interested in business, entrepreneurship,
                  and finance, and has worked with companies across the globe. Beyond work, he
                  enjoys singing and playing the piano and harmonica.
                </p>
                <Link
                  href="https://www.linkedin.com/in/rahul-naik-rk918/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  aria-label="Connect on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Our belief & future — 3 paragraphs + quote */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our belief &amp; future</h2>
            <p className="mb-4">
              We believe everybody should have knowledge about stocks and other forms of finance.
              Financial literacy shouldn&apos;t be a privilege — we want to help people learn the
              basics, ask questions, and make informed decisions. We build {siteConfig.name} as a
              place for that.
            </p>
            <p className="mb-4">
              One idea we keep in mind is summed up well by Bill Gates:
            </p>
            <blockquote className="border-l-4 border-cyan-500/70 pl-4 py-2 my-4 text-gray-300 italic">
              &ldquo;If you are born poor it&apos;s not your mistake, but if you die poor it&apos;s
              your mistake.&rdquo;
              <cite className="not-italic block text-gray-500 text-sm mt-2">— Bill Gates</cite>
            </blockquote>
            <p>
              We take that to heart. Our goal is to support anyone willing to learn and act, so
              that the next step is always within reach. We&apos;ll keep improving the platform and
              adding ways to make market knowledge more accessible.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
