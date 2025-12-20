"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface AuthorProfileProps {
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    authoredPosts: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      coverImage: string | null;
      publishedAt: Date | null;
      createdAt: Date;
      category: {
        name: string;
      } | null;
      _count: {
        likes: number;
        comments: number;
      };
    }>;
    _count: {
      followers: number;
    };
  };
}

export function AuthorProfile({ author }: AuthorProfileProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }

    try {
      const res = await fetch(`/api/authors/${author.id}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="mb-12 pb-12 border-b border-white/10">
        <div className="flex items-start gap-8 mb-6">
          {author.image ? (
            <Image
              src={author.image}
              alt={author.name || ""}
              width={120}
              height={120}
              className="rounded-full"
            />
          ) : (
            <div className="w-30 h-30 rounded-full bg-white/10 flex items-center justify-center text-4xl">
              {author.name?.[0] || author.email[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-serif font-bold mb-2">
              {author.name || author.email}
            </h1>
            {author.bio && (
              <p className="text-lg text-white/70 mb-4">{author.bio}</p>
            )}
            <div className="flex items-center gap-6 text-white/60">
              <span>{author._count.followers} followers</span>
              <span>{author.authoredPosts.length} posts</span>
            </div>
          </div>
          {session && session.user.id !== author.id && (
            <button
              onClick={handleFollow}
              className={`px-6 py-3 border transition-colors ${
                following
                  ? "border-white bg-white/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-2xl font-serif font-bold mb-8">Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {author.authoredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="group block border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
            >
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
                <div className="text-xs text-white/60 mb-2">
                  {post.category?.name} • {format(new Date(post.publishedAt || post.createdAt), "MMM d, yyyy")}
                </div>
                <h3 className="text-xl font-serif font-bold mb-2 group-hover:underline">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-4">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{format(new Date(post.publishedAt || post.createdAt), "MMM d, yyyy")}</span>
                  <span>
                    {post._count.likes} likes • {post._count.comments} comments
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

