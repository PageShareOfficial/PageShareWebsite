"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TrendingPost {
  id: string;
  title: string;
  slug: string;
}

export function TrendingTicker() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/posts/trending");
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch trending posts:", error);
      }
    }
    fetchTrending();
  }, []);

  if (posts.length === 0) return null;

  return (
    <div
      className="bg-white/5 border-b border-white/10 py-2 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-wider px-4 whitespace-nowrap">
          TRENDING:
        </span>
        <div className="flex-1 overflow-hidden">
          <div
            className={`flex gap-8 ${
              !isPaused ? "animate-scroll" : ""
            }`}
            style={{
              animation: !isPaused
                ? "scroll 30s linear infinite"
                : "none",
            }}
          >
            {[...posts, ...posts].map((post, idx) => (
              <Link
                key={`${post.id}-${idx}`}
                href={`/post/${post.slug}`}
                className="text-sm text-white/70 hover:text-white transition-colors whitespace-nowrap"
                tabIndex={0}
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

