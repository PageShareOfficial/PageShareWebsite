export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Main Split Layout */}
      <div className="flex min-h-screen">
        {/* Left Side - Sign Up Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo/Icon */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-2xl font-bold">𝕏</span>
            </div>

            {/* Main Heading Section */}
            <div className="space-y-12">
              {/* "Happening now" text */}
              <h1 className="text-6xl font-bold text-white leading-tight">
                Happening now
              </h1>

              {/* "Join today" heading */}
              <h2 className="text-3xl font-bold text-white">
                Join today.
              </h2>

              {/* Sign Up Buttons Section */}
              <div className="space-y-4">
                {/* Sign up with Google button */}
                <button className="w-full h-12 bg-white rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-gray-900 font-semibold">Sign up with Google</span>
                  </div>
                </button>

                {/* Sign up with Apple button */}
                <button className="w-full h-12 bg-white rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 6.39 12.05 6.39c2.25 0 3.85.83 5.18 1.56-1.19 1.65-1.81 3.75-1.38 5.96.48 2.45 2.13 4.28 4.15 4.28.5 0 .98-.05 1.45-.15-.3 1.01-1.15 1.85-2.2 2.24zm-1.05-16.28c-1.5 0-2.81 1.12-3.5 2.61-.65-1.39-1.75-2.61-3.5-2.61-1.96 0-3.63 1.59-3.63 3.71 0 2.9 2.65 6.29 7.13 6.29.5 0 1.01-.03 1.5-.1-.5-1.5-.5-2.9-.5-3.9 0-2.1 1.5-3.9 3.5-3.9z"/>
                    </svg>
                    <span className="text-gray-900 font-semibold">Sign up with Apple</span>
                  </div>
                </button>

                {/* OR divider */}
                <div className="flex items-center justify-center">
                  <div className="h-px flex-1 bg-gray-700"></div>
                  <div className="px-4">
                    <span className="text-gray-500 text-sm">OR</span>
                  </div>
                  <div className="h-px flex-1 bg-gray-700"></div>
                </div>

                {/* Create account button */}
                <button className="w-full h-12 bg-blue-500 hover:bg-blue-600 rounded-full text-white font-bold transition-colors">
                  Create account
                </button>

                {/* Terms and Privacy text */}
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-gray-500 text-center">
                    By signing up, you agree to the{" "}
                    <a href="#" className="text-blue-500 hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
                    , including{" "}
                    <a href="#" className="text-blue-500 hover:underline">Cookie Use</a>.
                  </p>
                </div>
              </div>

              {/* Already have account section */}
              <div className="pt-8">
                <div className="space-y-4">
                  <p className="text-white text-lg font-semibold">Already have an account?</p>
                  <button className="w-full h-12 bg-transparent border border-gray-600 rounded-full text-white font-bold hover:bg-gray-900 transition-colors">
                    Sign in
                  </button>
                </div>
              </div>

              {/* Get Grok link */}
              <div className="pt-4">
                <a href="#" className="flex items-center space-x-2 text-blue-500 hover:underline">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Get Grok</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image/Logo Section */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-black relative overflow-hidden">
          {/* Large X logo/icon */}
          <div className="w-96 h-96 flex items-center justify-center">
            <span className="text-white text-[400px] font-bold opacity-20">𝕏</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <a href="#" className="hover:underline">About</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Download the X app</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Grok</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Help Center</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Terms of Service</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Cookie Policy</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Accessibility</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Ads info</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Blog</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Careers</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Brand Resources</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Advertising</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Marketing</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">X for Business</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Developers</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">News</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:underline">Settings</a>
          </nav>
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">© 2025 X Corp.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
