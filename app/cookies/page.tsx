import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Cookie Policy - PageShare',
  description: 'Cookie Policy for PageShare platform',
};

export default function CookiesPage() {
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
        <h1 className="text-4xl sm:text-5xl font-black mb-8">Cookie Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
            <p className="mb-4">
              PageShare uses cookies and similar tracking technologies to track activity on our Platform and store certain information. We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for the Platform to function properly</li>
              <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics:</strong> To understand how users interact with the Platform</li>
              <li><strong>Security:</strong> To detect and prevent fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1 Strictly Necessary Cookies</h3>
            <p className="mb-4">
              These cookies are essential for the Platform to function and cannot be switched off. They are usually set in response to actions made by you, such as setting privacy preferences or logging in.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">3.2 Performance Cookies</h3>
            <p className="mb-4">
              These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our Platform. They help us understand which pages are most popular and how visitors move around the site.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">3.3 Functionality Cookies</h3>
            <p className="mb-4">
              These cookies enable the Platform to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">3.4 Targeting/Advertising Cookies</h3>
            <p className="mb-4">
              These cookies may be set through our Platform by our advertising partners. They may be used to build a profile of your interests and show you relevant content on other sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Platform, deliver advertisements, and so on. These third-party cookies are governed by the respective third-party privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
            <p className="mb-4">
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your browser settings. Most web browsers allow some control of most cookies through the browser settings.
            </p>
            <p className="mb-4">
              However, if you choose to disable cookies, some features of the Platform may not function properly, and you may not be able to use certain services.
            </p>
            <p className="mb-4">
              To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">www.allaboutcookies.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Browser-Specific Instructions</h2>
            <p className="mb-4">To manage cookies in your browser:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies or this Cookie Policy, please contact us through the Platform's contact page.
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

