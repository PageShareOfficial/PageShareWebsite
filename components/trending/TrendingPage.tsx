import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { FiTrendingUp, FiHeart, FiMessageCircle, FiBookmark } from "react-icons/fi";

interface TrendingPageProps {
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    author: {
      name: string | null;
      email: string;
    };
    category: {
      name: string;
    } | null;
    _count: {
      likes: number;
      bookmarks: number;
      comments: number;
    };
  }>;
}

export function TrendingPage({ posts }: TrendingPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <FiTrendingUp size={32} className="text-white" />
        <h1 className="text-4xl font-serif font-bold">Trending Now</h1>
      </div>
      <p className="text-white/70 text-lg mb-12">
        The most popular stories on PageShare right now
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="group block border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 relative"
          >
            {index < 3 && (
              <div className="absolute -top-3 -right-3 z-10 bg-white text-black px-3 py-1 text-xs font-bold rounded-full border-2 border-black">
                #{index + 1}
              </div>
            )}
            {post.coverImage && (
              <div className="relative aspect-video overflow-hidden border-b border-white/10">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {post.category && (
                  <span className="text-xs px-2 py-1 border border-white/20 rounded">
                    {post.category.name}
                  </span>
                )}
                <span className="text-xs text-white/60">
                  {format(new Date(post.publishedAt || post.createdAt), "MMM d")}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold mb-2 group-hover:underline line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-white/70 line-clamp-2 mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{post.author.name || post.author.email}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <FiHeart size={14} />
                    <span>{post._count.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiMessageCircle size={14} />
                    <span>{post._count.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiBookmark size={14} />
                    <span>{post._count.bookmarks}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

