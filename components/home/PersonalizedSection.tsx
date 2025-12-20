"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: {
    name: string | null;
    email: string;
  };
  category: {
    name: string;
  } | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export function PersonalizedSection() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!session) return;

    async function fetchPersonalized() {
      try {
        const res = await fetch("/api/posts/personalized");
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch personalized posts:", error);
      }
    }

    fetchPersonalized();
  }, [session]);

  if (!session || posts.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Because you follow...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
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
                  {post.category?.name} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                </div>
                <h3 className="text-xl font-serif font-bold mb-2 group-hover:underline">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-4">{post.excerpt}</p>
                )}
                <div className="text-xs text-white/60">
                  By {post.author.name || post.author.email}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

