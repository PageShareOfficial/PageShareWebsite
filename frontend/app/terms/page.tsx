import Link from 'next/link';
import Image from 'next/image';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'PageShare Terms of Service. Read the terms and conditions for using our social platform for stocks, NFTs and crypto.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl sm:text-5xl font-black mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PageShare ("the Platform"), ("we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Platform Description</h2>
            <p>
              PageShare is a social platform for sharing market thoughts, discovering trading signals, and engaging in discussions about stocks, ETFs, and cryptocurrencies. The Platform is designed for educational and discussion purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Not Financial Advice</h2>
            <p className="mb-4">
              PageShare is not a securities broker-dealer, investment adviser, or any other type of financial professional. No content on the PageShare platform should be considered:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>An offer to buy or sell securities</li>
              <li>Solicitation of an offer to buy or sell securities</li>
              <li>Investment advice or financial advice</li>
              <li>Recommendation of any security, transaction, or order</li>
            </ul>
            <p className="mt-4">
              By using the PageShare platform, you understand and agree that PageShare does not provide investment advice, recommend any security, transaction, or order, issue securities, produce or provide research.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. User Accounts</h2>
            <p className="mb-4">To use certain features of the Platform, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your password</li>
              <li>Accept all responsibility for activity under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Engage in market manipulation, pump-and-dump schemes, or insider trading</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the Platform's operation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Content Ownership</h2>
            <p>
              You retain ownership of content you post on the Platform. By posting content, you grant PageShare a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
            <p>
              The Platform and its original content, features, and functionality are owned by PageShare and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Platform immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, PageShare shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Risk Disclosure</h2>
            <p>
              Trading and investing in securities, cryptocurrencies, and other financial instruments involves substantial risk of loss. Past performance is not indicative of future results. You should carefully consider whether trading or investing is suitable for you in light of your circumstances, knowledge, and financial resources.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Platform after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us through the Platform's contact page.
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

