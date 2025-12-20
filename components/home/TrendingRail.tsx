import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export async function TrendingRail() {
  const trending = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: true,
      category: true,
      likes: true,
      _count: {
        select: { likes: true, bookmarks: true, comments: true },
      },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { publishedAt: "desc" },
    ],
    take: 6,
  });

  if (trending.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Trending Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending.map((post) => (
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
    </section>
  );
}

