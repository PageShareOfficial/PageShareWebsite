"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ReadingHistoryItem {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
  };
  lastScrollPercent: number;
}

export function ContinueReading() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    if (!session) return;

    async function fetchHistory() {
      try {
        const res = await fetch("/api/reading-history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch reading history:", error);
      }
    }

    fetchHistory();
  }, [session]);

  if (!session || history.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Continue Reading</h2>
        <div className="space-y-4">
          {history.map((item) => (
            <Link
              key={item.post.id}
              href={`/post/${item.post.slug}`}
              className="block group border-l-4 border-white/20 hover:border-white/40 pl-6 py-4 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-serif font-bold group-hover:underline">
                  {item.post.title}
                </h3>
                <div className="text-sm text-white/60">
                  {Math.round(item.lastScrollPercent)}% read
                </div>
              </div>
              {item.post.excerpt && (
                <p className="text-white/70 text-sm">{item.post.excerpt}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

