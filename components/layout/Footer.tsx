"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiMail,
  FiRss,
  FiBook,
  FiTrendingUp,
  FiStar,
  FiTag,
  FiUsers,
  FiAward,
  FiZap,
  FiPenTool,
  FiLayers,
  FiBell,
  FiSettings,
  FiHelpCircle,
  FiFileText,
  FiShield,
  FiHeart,
  FiGlobe,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFrequency, setNewsletterFrequency] = useState("weekly");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form
    alert("Thank you for your message! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const services = [
    { icon: FiBook, title: "Content Library", desc: "Access thousands of articles", href: "/explore" },
    { icon: FiPenTool, title: "Writer Tools", desc: "Professional writing suite", href: "/write" },
    { icon: FiTrendingUp, title: "Analytics", desc: "Track your content performance", href: "/writer/dashboard" },
    { icon: FiStar, title: "Editor's Picks", desc: "Curated premium content", href: "/explore?filter=editors-picks" },
    { icon: FiTag, title: "Topic Discovery", desc: "Explore by interests", href: "/tags" },
    { icon: FiUsers, title: "Community", desc: "Connect with writers", href: "/authors" },
  ];

  const quickLinks = {
    "For Readers": [
      { name: "Explore Stories", href: "/explore", icon: FiBook },
      { name: "Trending Now", href: "/trending", icon: FiTrendingUp },
      { name: "Editor's Picks", href: "/explore?filter=editors-picks", icon: FiStar },
      { name: "Browse Tags", href: "/tags", icon: FiTag },
      { name: "Reading List", href: "/reading-list", icon: FiLayers },
      { name: "Collections", href: "/collections", icon: FiLayers },
    ],
    "For Writers": [
      { name: "Start Writing", href: "/write", icon: FiPenTool },
      { name: "Writer Dashboard", href: "/writer/dashboard", icon: FiZap },
      { name: "Writing Guidelines", href: "/guidelines", icon: FiFileText },
      { name: "Editorial Policy", href: "/editorial-policy", icon: FiShield },
      { name: "Become a Writer", href: "/become-a-writer", icon: FiAward },
      { name: "Writer Resources", href: "/writer-resources", icon: FiBook },
    ],
    "Company": [
      { name: "About PageShare", href: "/about", icon: FiGlobe },
      { name: "Our Mission", href: "/mission", icon: FiHeart },
      { name: "Careers", href: "/careers", icon: FiUsers },
      { name: "Press Kit", href: "/press", icon: FiFileText },
      { name: "Partners", href: "/partners", icon: FiUsers },
      { name: "Contact Us", href: "/contact", icon: FiMail },
    ],
    "Legal": [
      { name: "Terms of Service", href: "/terms", icon: FiFileText },
      { name: "Privacy Policy", href: "/privacy", icon: FiShield },
      { name: "Cookie Policy", href: "/cookies", icon: FiShield },
      { name: "Content Policy", href: "/content-policy", icon: FiFileText },
      { name: "DMCA", href: "/dmca", icon: FiShield },
      { name: "Accessibility", href: "/accessibility", icon: FiHelpCircle },
    ],
  };

  const categories = [
    "Technology", "Design", "Business", "Culture", "Science", "Art",
    "Music", "Film", "Books", "Travel", "Food", "Health", "Fitness",
    "Education", "Politics", "History", "Philosophy", "Startups",
  ];

  const popularTags = [
    "JavaScript", "React", "Design Systems", "Startups", "Productivity",
    "Writing", "Philosophy", "Culture", "Business Strategy", "UX Design",
    "Web Development", "Creative Writing", "Entrepreneurship", "Tech Trends",
    "Design Thinking", "Product Management", "Content Strategy", "Innovation",
  ];

  return (
    <footer className="bg-black border-t-2 border-white/20 mt-20">
      {/* Premium Banner */}
      <div className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-xl"></div>
                <div className="relative text-4xl font-serif font-bold">PageShare</div>
              </div>
              <div className="hidden md:block h-12 w-px bg-white/20"></div>
              <div>
                <div className="text-sm font-medium mb-1">Premium Editorial Platform</div>
                <div className="text-xs text-white/60">Where stories meet readers</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">2,847</div>
                <div className="text-xs text-white/60">Active Readers</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-xs text-white/60">New Posts</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">89</div>
                <div className="text-xs text-white/60">Writers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Services Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3">
            <FiZap size={24} />
            Our Services
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Link
                  key={index}
                  href={service.href}
                  className="group p-6 border border-white/10 hover:border-white/30 rounded-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Icon size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <h4 className="font-serif font-bold mb-2 group-hover:underline">{service.title}</h4>
                  <p className="text-sm text-white/60">{service.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Newsletter & Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 pb-16 border-b border-white/10">
          {/* Newsletter */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FiBell size={24} />
              <h3 className="text-2xl font-serif font-bold">Stay Updated</h3>
            </div>
            <p className="text-white/70 mb-6 leading-relaxed">
              Get the latest stories, editor's picks, and exclusive content delivered to your inbox.
              Join thousands of readers who never miss a great story.
            </p>
            {subscribed ? (
              <div className="p-6 border-2 border-white/30 bg-white/5 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <FiCheck size={20} />
                </div>
                <div>
                  <div className="font-medium">Subscribed!</div>
                  <div className="text-sm text-white/60">Check your email to confirm</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                    required
                  />
                </div>
                <div>
                  <select
                    value={newsletterFrequency}
                    onChange={(e) => setNewsletterFrequency(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                  >
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                    <option value="monthly">Monthly Roundup</option>
                    <option value="off">No Emails</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 font-medium flex items-center justify-center gap-2 group"
                >
                  Subscribe
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-white/50">
                  By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>

          {/* Contact Form */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FiMail size={24} />
              <h3 className="text-2xl font-serif font-bold">Get in Touch</h3>
            </div>
            <p className="text-white/70 mb-6 leading-relaxed">
              Have a question, suggestion, or want to collaborate? We'd love to hear from you.
              Our team typically responds within 24 hours.
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="bg-white/5 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-white/5 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                  required
                />
              </div>
              <textarea
                placeholder="Your message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={5}
                className="w-full bg-white/5 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm resize-none"
                required
              />
              <button
                type="submit"
                className="w-full px-6 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 font-medium flex items-center justify-center gap-2 group"
              >
                Send Message
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 pb-16 border-b border-white/10">
          {Object.entries(quickLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-serif font-bold mb-6 text-lg flex items-center gap-2">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
                      >
                        <Icon size={14} className="group-hover:scale-110 transition-transform" />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Categories & Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 pb-16 border-b border-white/10">
          {/* Categories */}
          <div>
            <h4 className="font-serif font-bold mb-6 text-lg flex items-center gap-2">
              <FiTag size={20} />
              Browse Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase()}`}
                  className="px-4 py-2 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-200 rounded-lg text-sm group flex items-center gap-2"
                >
                  <span>{category}</span>
                  <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div>
            <h4 className="font-serif font-bold mb-6 text-lg flex items-center gap-2">
              <FiTrendingUp size={20} />
              Popular Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-3 py-1.5 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-200 rounded text-sm group"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Social & Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Social Media */}
          <div>
            <h4 className="font-serif font-bold mb-6 text-lg">Connect With Us</h4>
            <p className="text-white/70 mb-6 text-sm">
              Follow us on social media for the latest updates, featured stories, and community highlights.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/5"
                aria-label="GitHub"
              >
                <FiGithub size={24} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/5"
                aria-label="Twitter"
              >
                <FiTwitter size={24} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/5"
                aria-label="LinkedIn"
              >
                <FiLinkedin size={24} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="mailto:contact@pageshare.com"
                className="group p-4 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/5"
                aria-label="Email"
              >
                <FiMail size={24} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="/rss"
                className="group p-4 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/5"
                aria-label="RSS Feed"
              >
                <FiRss size={24} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Additional Resources */}
          <div>
            <h4 className="font-serif font-bold mb-6 text-lg">Resources</h4>
            <div className="space-y-4">
              <Link
                href="/help"
                className="flex items-center gap-3 p-4 border border-white/10 hover:border-white/30 rounded-lg transition-all duration-200 hover:bg-white/5 group"
              >
                <FiHelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium">Help Center</div>
                  <div className="text-sm text-white/60">Find answers to common questions</div>
                </div>
              </Link>
              <Link
                href="/api-docs"
                className="flex items-center gap-3 p-4 border border-white/10 hover:border-white/30 rounded-lg transition-all duration-200 hover:bg-white/5 group"
              >
                <FiFileText size={20} className="group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium">API Documentation</div>
                  <div className="text-sm text-white/60">Integrate PageShare into your app</div>
                </div>
              </Link>
              <Link
                href="/status"
                className="flex items-center gap-3 p-4 border border-white/10 hover:border-white/30 rounded-lg transition-all duration-200 hover:bg-white/5 group"
              >
                <FiZap size={20} className="group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium">System Status</div>
                  <div className="text-sm text-white/60">Check our uptime and performance</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-white/60">
              <div>&copy; {new Date().getFullYear()} PageShare. All rights reserved.</div>
              <div className="hidden md:block">•</div>
              <div>Made with <FiHeart size={14} className="inline mx-1" /> for writers and readers</div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="text-white/60 hover:text-white transition-colors">
                Cookies
              </Link>
              <Link href="/sitemap" className="text-white/60 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
