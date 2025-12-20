"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface TagPageProps {
  tag: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
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
        comments: number;
      };
    }>;
  };
}

export function TagPage({ tag }: TagPageProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }

    try {
      const res = await fetch(`/api/tags/${tag.slug}/follow`, {
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
      <div className="mb-12 pb-12 border-b border-white/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-5xl font-serif font-bold mb-4">{tag.name}</h1>
            {tag.description && (
              <p className="text-xl text-white/70">{tag.description}</p>
            )}
          </div>
          {session && (
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
        <div className="text-white/60">
          {tag.posts.length} {tag.posts.length === 1 ? "post" : "posts"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tag.posts.map((post) => (
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
                <span>{post.author.name || post.author.email}</span>
                <span>
                  {post._count.likes} likes • {post._count.comments} comments
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

