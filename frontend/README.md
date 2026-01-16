# PageShare

A modern social platform for financial markets where users can share insights, track stocks and cryptocurrencies, discover news, and connect with fellow investors.

## Overview

PageShare is built with Next.js and TypeScript, providing a comprehensive social media experience tailored for financial markets. Users can post thoughts about stocks and crypto, manage watchlists, discover market news, and interact with a community of investors.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Runtime**: Node.js 20.x or higher

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 20.x or higher ([Download](https://nodejs.org/))
- **npm**: 10.x or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PageShareWebsite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory (this file is gitignored and will not be committed):

```bash
# API Keys (Optional - app works without them using fallbacks)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
NEXT_PUBLIC_GNEWS_API_KEY=your_gnews_api_key_here
NEXT_PUBLIC_NEWS_API_KEY=your_newsapi_key_here
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here

# Backend API URL (if using external backend)
# NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

**Note**: 
- All API keys are optional. The app includes fallback mechanisms (e.g., Yahoo Finance for stocks, CoinGecko for crypto)
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side
- Server-side variables (without `NEXT_PUBLIC_`) are only available in API routes and server components

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
PageShareWebsite/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (news, stock, ticker, search)
│   ├── [username]/        # Dynamic user profile routes
│   ├── ticker/            # Ticker detail pages
│   ├── home/              # Home feed
│   ├── discover/          # Search and news discovery
│   ├── watchlist/         # User watchlist
│   └── ...
├── components/            # React components
│   ├── app/              # Application components
│   │   ├── common/       # Reusable UI components
│   │   ├── layout/       # Layout components (Sidebar, Topbar, RightRail)
│   │   ├── composer/     # Post/comment composer
│   │   ├── discover/     # Search and news components
│   │   ├── feed/         # Feed components
│   │   ├── modals/       # Modal components
│   │   ├── post/         # Post-related components
│   │   ├── profile/      # Profile components
│   │   └── ticker/       # Ticker-related components
│   └── auth/             # Authentication components
├── hooks/                 # Custom React hooks
│   ├── common/           # Shared hooks
│   ├── composer/         # Composer-related hooks
│   ├── discover/         # Search and news hooks
│   ├── features/         # Feature-specific hooks
│   ├── post/             # Post-related hooks
│   ├── ticker/           # Ticker hooks
│   └── user/             # User-related hooks
├── utils/                 # Utility functions
│   ├── api/              # API utilities (stock, news, ticker)
│   ├── content/          # Content utilities (bookmarks, reports, reposts)
│   ├── core/             # Core utilities (date, navigation, storage)
│   ├── discover/         # Discovery utilities
│   ├── ticker/           # Ticker utilities
│   └── user/             # User utilities
├── types/                 # TypeScript type definitions
├── data/                  # Mock data for development
├── constants/             # Application constants
└── public/                # Static assets
```

## Key Features

- **Social Feed**: Post, like, comment, and repost financial insights
- **Ticker Tracking**: Detailed pages for stocks and cryptocurrencies with charts and metrics
- **Watchlist Management**: Track your favorite tickers with real-time price updates
- **News Discovery**: Curated financial news with category filtering
- **User Profiles**: Comprehensive profiles with posts, replies, and follower/following management
- **Search**: Unified search for users, stocks, and cryptocurrencies
- **Content Management**: Bookmark posts, mute/block users, report content

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint to check code quality

### Code Style

- **TypeScript**: Strict mode enabled for type safety
- **Components**: Functional components with TypeScript interfaces
- **Hooks**: Custom hooks for reusable logic
- **Styling**: Tailwind CSS utility classes
- **State Management**: React hooks (useState, useEffect, useCallback)

### Environment-Specific Code

The application uses environment variables and runtime checks for environment-specific behavior:

- **Development**: Enhanced error messages, debug logging
- **Production**: Optimized builds, minimal logging, error boundaries

Code examples:
```typescript
// Environment variable access
const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

// Environment checks
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

## API Integration

### Stock Data

- **Primary**: Alpha Vantage API (requires API key)
- **Fallback**: Yahoo Finance (free, no API key needed)

### Cryptocurrency Data

- **Primary**: CoinGecko API (free, no API key required)

### News

- **Primary**: GNews API (requires API key)
- **Fallback**: NewsAPI (requires API key)

All API routes are located in `app/api/` and handle proxy requests, caching, and error handling.

## Deployment

### Environment Variables

Set the following environment variables in your deployment platform (Vercel, Netlify, etc.):

- `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` (optional)
- `NEXT_PUBLIC_GNEWS_API_KEY` (optional)
- `NEXT_PUBLIC_NEWS_API_KEY` (optional)
- `NEXT_PUBLIC_GIPHY_API_KEY` (optional)

### Build Configuration

The application is configured for standard Next.js deployment. For static export (if needed), modify `next.config.mjs`:

```javascript
output: 'export'
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure code passes linting (`npm run lint`)
4. Test thoroughly
5. Submit a pull request

## License

Private - All rights reserved

## Support

For issues, questions, or contributions, please open an issue in the repository.
