'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Logo from '@/components/Logo';

// Step 1 Schema
const step1Schema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  country: z.string().min(1, 'Please select a country'),
  timezone: z.string().min(1, 'Please select a timezone'),
  displayName: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  agreeTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
  understandNotAdvice: z.boolean().refine((val) => val === true, 'You must acknowledge this'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Step 2 Schema
const step2Schema = z.object({
  primaryInterests: z.array(z.string()).min(1, 'Select at least one market interest'),
  experienceLevel: z.string().min(1, 'Please select your experience level'),
  timeHorizon: z.string().min(1, 'Please select your time horizon'),
  watchlistTickers: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  labsInterest: z.boolean().default(false),
  labsFeatures: z.array(z.string()).optional(),
  communityConduct: z.boolean().refine((val) => val === true, 'You must agree to community conduct'),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

// Countries list (abbreviated for demo)
const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Japan',
  'Singapore',
  'Other',
];

// Timezones (abbreviated for demo)
const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
];

const primaryInterests = ['Stocks', 'ETFs', 'Crypto'];
const topics = [
  'Earnings',
  'Macro',
  'Long-term investing',
  'News-driven discussion',
  'Options',
  'DeFi',
];
const labsFeatures = [
  'News impact',
  'Earnings summaries',
  'Sentiment notes',
  'Volatility signals',
];

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      marketingOptIn: false,
      agreeTerms: false,
      understandNotAdvice: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      primaryInterests: [],
      topics: [],
      labsFeatures: [],
      labsInterest: false,
      communityConduct: false,
    },
  });

  const onStep1Submit = (data: Step1FormData) => {
    setStep(2);
  };

  const onStep2Submit = async (data: Step2FormData) => {
    setIsSubmitting(true);

    // Combine both steps' data
    const step1Data = step1Form.getValues();
    const signUpPayload = {
      ...step1Data,
      confirmPassword: undefined, // Remove from payload
    };
    const onboardingPayload = data;

    // Save to localStorage
    localStorage.setItem('pageshare_signup', JSON.stringify({
      signUp: signUpPayload,
      onboarding: onboardingPayload,
      timestamp: new Date().toISOString(),
    }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Redirect after 1.5 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-black to-teal-950/10 opacity-50 pointer-events-none"></div>
      
      {/* Subtle grain texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Desktop Only */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 xl:p-16">
          <div className="max-w-md">
            <div className="mb-8">
              <Logo size={50} />
            </div>
            <h1 className="text-6xl xl:text-7xl font-black text-white mb-6 leading-tight">
              PageShare
            </h1>
            <p className="text-2xl xl:text-3xl font-black text-white">Join now.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 text-center">
              <Logo size={40} className="mx-auto mb-6" />
              <h1 className="text-5xl font-black text-white mb-3">PageShare</h1>
              <p className="text-2xl font-black text-white">Join now.</p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Step {step} of 2</span>
                <span className="text-sm text-gray-400">{step === 1 ? 'Account' : 'Preferences'}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 bg-teal-500/20 border border-teal-500/50 rounded-xl text-center">
                <p className="text-teal-400 font-medium">Account created successfully! Redirecting...</p>
              </div>
            )}

            {/* Step 1 Form */}
            {step === 1 && (
              <form
                onSubmit={step1Form.handleSubmit(onStep1Submit)}
                className="space-y-6 animate-fade-in"
              >
                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 6.39 12.05 6.39c2.25 0 3.85.83 5.18 1.56-1.19 1.65-1.81 3.75-1.38 5.96.48 2.45 2.13 4.28 4.15 4.28.5 0 .98-.05 1.45-.15-.3 1.01-1.15 1.85-2.2 2.24zm-1.05-16.28c-1.5 0-2.81 1.12-3.5 2.61-.65-1.39-1.75-2.61-3.5-2.61-1.96 0-3.63 1.59-3.63 3.71 0 2.9 2.65 6.29 7.13 6.29.5 0 1.01-.03 1.5-.1-.5-1.5-.5-2.9-.5-3.9 0-2.1 1.5-3.9 3.5-3.9z"/>
                    </svg>
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-gray-500 text-sm">or</span>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    {...step1Form.register('email')}
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                  {step1Form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    {...step1Form.register('username', {
                      onChange: (e) => {
                        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      },
                    })}
                    type="text"
                    id="username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="username"
                  />
                  {step1Form.formState.errors.username && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    {...step1Form.register('password')}
                    type="password"
                    id="password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  {step1Form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    {...step1Form.register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                    Country/Region
                  </label>
                  <select
                    {...step1Form.register('country')}
                    id="country"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country} className="bg-black">
                        {country}
                      </option>
                    ))}
                  </select>
                  {step1Form.formState.errors.country && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.country.message}</p>
                  )}
                </div>

                {/* Timezone */}
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    {...step1Form.register('timezone')}
                    id="timezone"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select timezone</option>
                    {timezones.map((tz) => (
                      <option key={tz} value={tz} className="bg-black">
                        {tz}
                      </option>
                    ))}
                  </select>
                  {step1Form.formState.errors.timezone && (
                    <p className="mt-1 text-sm text-red-400">{step1Form.formState.errors.timezone.message}</p>
                  )}
                </div>

                {/* Display Name (Optional) */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    {...step1Form.register('displayName')}
                    type="text"
                    id="displayName"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Your display name"
                  />
                </div>

                {/* Marketing Opt-in */}
                <div className="flex items-start">
                  <input
                    {...step1Form.register('marketingOptIn')}
                    type="checkbox"
                    id="marketingOptIn"
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500"
                  />
                  <label htmlFor="marketingOptIn" className="ml-3 text-sm text-gray-300">
                    Send me product updates and market insights
                  </label>
                </div>

                {/* Required Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      {...step1Form.register('agreeTerms')}
                      type="checkbox"
                      id="agreeTerms"
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                    <label htmlFor="agreeTerms" className="ml-3 text-sm text-gray-300">
                      I agree to the{' '}
                      <Link href="/terms" className="text-teal-400 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-teal-400 hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {step1Form.formState.errors.agreeTerms && (
                    <p className="text-sm text-red-400">{step1Form.formState.errors.agreeTerms.message}</p>
                  )}

                  <div className="flex items-start">
                    <input
                      {...step1Form.register('understandNotAdvice')}
                      type="checkbox"
                      id="understandNotAdvice"
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                    <label htmlFor="understandNotAdvice" className="ml-3 text-sm text-gray-300">
                      I understand PageShare is for discussion and education, not financial advice.
                    </label>
                  </div>
                  {step1Form.formState.errors.understandNotAdvice && (
                    <p className="text-sm text-red-400">{step1Form.formState.errors.understandNotAdvice.message}</p>
                  )}
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </button>

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-teal-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {/* Step 2 Form */}
            {step === 2 && (
              <form
                onSubmit={step2Form.handleSubmit(onStep2Submit)}
                className="space-y-6 animate-fade-in"
              >
                {/* Primary Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Primary Interests <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {primaryInterests.map((interest) => {
                      const isSelected = step2Form.watch('primaryInterests')?.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            const current = step2Form.getValues('primaryInterests') || [];
                            if (current.includes(interest)) {
                              step2Form.setValue('primaryInterests', current.filter((i) => i !== interest));
                            } else {
                              step2Form.setValue('primaryInterests', [...current, interest]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-teal-500 text-white'
                              : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  {step2Form.formState.errors.primaryInterests && (
                    <p className="mt-2 text-sm text-red-400">
                      {step2Form.formState.errors.primaryInterests.message}
                    </p>
                  )}
                </div>

                {/* Experience Level */}
                <div>
                  <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-300 mb-2">
                    Experience Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...step2Form.register('experienceLevel')}
                    id="experienceLevel"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select experience level</option>
                    <option value="beginner" className="bg-black">Beginner</option>
                    <option value="intermediate" className="bg-black">Intermediate</option>
                    <option value="advanced" className="bg-black">Advanced</option>
                    <option value="professional" className="bg-black">Professional</option>
                  </select>
                  {step2Form.formState.errors.experienceLevel && (
                    <p className="mt-1 text-sm text-red-400">
                      {step2Form.formState.errors.experienceLevel.message}
                    </p>
                  )}
                </div>

                {/* Time Horizon */}
                <div>
                  <label htmlFor="timeHorizon" className="block text-sm font-medium text-gray-300 mb-2">
                    Time Horizon <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...step2Form.register('timeHorizon')}
                    id="timeHorizon"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select time horizon</option>
                    <option value="days" className="bg-black">Days</option>
                    <option value="weeks" className="bg-black">Weeks</option>
                    <option value="months" className="bg-black">Months</option>
                    <option value="years" className="bg-black">Years</option>
                  </select>
                  {step2Form.formState.errors.timeHorizon && (
                    <p className="mt-1 text-sm text-red-400">
                      {step2Form.formState.errors.timeHorizon.message}
                    </p>
                  )}
                </div>

                {/* Watchlist Tickers */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Watchlist Tickers <span className="text-gray-500">(optional)</span>
                  </label>
                  <TickerInput
                    value={step2Form.watch('watchlistTickers') || []}
                    onChange={(tickers) => step2Form.setValue('watchlistTickers', tickers)}
                  />
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Topics <span className="text-gray-500">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {topics.map((topic) => {
                      const isSelected = step2Form.watch('topics')?.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => {
                            const current = step2Form.getValues('topics') || [];
                            if (current.includes(topic)) {
                              step2Form.setValue('topics', current.filter((t) => t !== topic));
                            } else {
                              step2Form.setValue('topics', [...current, topic]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-teal-500 text-white'
                              : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Labs Interest */}
                <div>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <label htmlFor="labsInterest" className="block text-sm font-medium text-gray-300 mb-1">
                        Labs (AI Experiments)
                      </label>
                      <p className="text-xs text-gray-500">
                        Premium experimental tools for market analysis
                      </p>
                    </div>
                    <input
                      {...step2Form.register('labsInterest')}
                      type="checkbox"
                      id="labsInterest"
                      className="w-12 h-6 rounded-full bg-white/10 border-white/20 checked:bg-teal-500 focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                  </div>

                  {/* Labs Features (shown when Labs is enabled) */}
                  {step2Form.watch('labsInterest') && (
                    <div className="mt-4 p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Labs Features
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {labsFeatures.map((feature) => {
                          const isSelected = step2Form.watch('labsFeatures')?.includes(feature);
                          return (
                            <button
                              key={feature}
                              type="button"
                              onClick={() => {
                                const current = step2Form.getValues('labsFeatures') || [];
                                if (current.includes(feature)) {
                                  step2Form.setValue('labsFeatures', current.filter((f) => f !== feature));
                                } else {
                                  step2Form.setValue('labsFeatures', [...current, feature]);
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-teal-500 text-white'
                                  : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {feature}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Community Conduct */}
                <div className="flex items-start">
                  <input
                    {...step2Form.register('communityConduct')}
                    type="checkbox"
                    id="communityConduct"
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500"
                  />
                  <label htmlFor="communityConduct" className="ml-3 text-sm text-gray-300">
                    I agree to community conduct: No spam, manipulation, pump-and-dump, or misleading content.{' '}
                    <span className="text-red-400">*</span>
                  </label>
                </div>
                {step2Form.formState.errors.communityConduct && (
                  <p className="text-sm text-red-400">
                    {step2Form.formState.errors.communityConduct.message}
                  </p>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-4 bg-white/5 border border-white/20 rounded-full text-white font-semibold hover:bg-white/10 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ticker Input Component
function TickerInput({ value, onChange }: { value: string[]; onChange: (tickers: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const ticker = inputValue.trim().toUpperCase();
      if (!value.includes(ticker) && /^[A-Z0-9]+$/.test(ticker)) {
        onChange([...value, ticker]);
        setInputValue('');
      }
    }
  };

  const removeTicker = (ticker: string) => {
    onChange(value.filter((t) => t !== ticker));
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="Type ticker and press Enter (e.g., AAPL, SPY, BTC)"
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center px-3 py-1 bg-teal-500/20 border border-teal-500/50 rounded-full text-sm text-teal-400"
            >
              {ticker}
              <button
                type="button"
                onClick={() => removeTicker(ticker)}
                className="ml-2 text-teal-400 hover:text-teal-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

