"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface Post {
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
}

export function ExploreFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");
  const [category, setCategory] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [sort, category, readingTime]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (category) params.set("category", category);
      if (readingTime) params.set("readingTime", readingTime);

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold mb-8">Explore</h1>

      {/* Filters */}
      <div className="mb-12 space-y-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="new">New</option>
            <option value="trending">Trending</option>
            <option value="top-7d">Top (7 days)</option>
            <option value="top-30d">Top (30 days)</option>
            <option value="most-commented">Most Commented</option>
          </select>

          <select
            value={category || ""}
            onChange={(e) => setCategory(e.target.value || null)}
            className="bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="">All Categories</option>
            <option value="technology">Technology</option>
            <option value="culture">Culture</option>
            <option value="business">Business</option>
            <option value="design">Design</option>
            <option value="science">Science</option>
          </select>

          <select
            value={readingTime || ""}
            onChange={(e) => setReadingTime(e.target.value || null)}
            className="bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="">Any Reading Time</option>
            <option value="short">&lt; 5 min</option>
            <option value="medium">5-10 min</option>
            <option value="long">10+ min</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-white/10 animate-pulse">
              <div className="aspect-video bg-white/10"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/60">No posts found.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}

