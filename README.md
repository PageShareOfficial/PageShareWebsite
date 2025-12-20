# PageShare

A production-ready, magazine-style Medium-like platform built with Next.js 14, featuring a strict black & white editorial design.

## Features

- **Multi-author platform** with role-based access (USER, AUTHOR, ADMIN)
- **MDX editor** with split view, autosave, and version history
- **Subscription system** with customizable preferences
- **Social features**: likes, bookmarks, comments, follows
- **Personalized feed** based on followed authors and tags
- **Reading history** with progress tracking
- **Collections** for organizing bookmarked posts
- **Admin dashboard** for moderation and content management
- **Trending ticker** and editorial sections
- **Kinetic typography** hero section
- **Fully monochrome** black & white design

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM** (SQLite for dev, Postgres-compatible)
- **NextAuth** (Credentials + GitHub OAuth)
- **Framer Motion** (animations)
- **MDX** for content rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PageShare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id" (optional)
GITHUB_CLIENT_SECRET="your-github-client-secret" (optional)
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Accounts

After seeding, you can sign in with:

- **Admin**: admin@pageshare.com / password123
- **Author 1**: author1@pageshare.com / password123
- **Author 2**: author2@pageshare.com / password123
- **User 1**: user1@pageshare.com / password123
- **User 2**: user2@pageshare.com / password123

## Project Structure

```
PageShare/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── writer/            # Writer dashboard
│   ├── post/              # Post detail pages
│   └── ...
├── components/            # React components
│   ├── layout/            # Header, Footer
│   ├── home/              # Home page components
│   ├── post/              # Post detail components
│   ├── writer/            # Writer dashboard components
│   └── mdx/               # MDX custom components
├── lib/                   # Utility functions
├── prisma/                # Prisma schema and migrations
└── public/                 # Static assets
```

## Key Features

### MDX Editor
- Split view (write + live preview)
- Autosave every 30 seconds
- Version history (last 5 versions)
- Custom MDX components (Callout, PullQuote, Figure, etc.)

### Subscription Center
- Digest frequency (Daily, Weekly, Off)
- Content type preferences
- Quiet hours configuration
- Email delivery channel

### Admin Features
- Post moderation
- Comment moderation
- Editor's picks management
- Category and tag management

## Database

The project uses SQLite for development but the schema is compatible with PostgreSQL. To switch to PostgreSQL:

1. Update `DATABASE_URL` in `.env`
2. Change `provider` in `prisma/schema.prisma` to `postgres`
3. Run `npx prisma migrate dev`

## Deployment

1. Set up a PostgreSQL database
2. Update environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Deploy to Vercel, Railway, or your preferred platform

## License

MIT

