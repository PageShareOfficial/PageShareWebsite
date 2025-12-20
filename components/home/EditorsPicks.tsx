import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export async function EditorsPicks() {
  const picks = await prisma.postPin.findMany({
    where: { position: "EDITORS_PICK" },
    include: {
      post: {
        include: {
          author: true,
          category: true,
        },
      },
    },
    take: 4,
  });

  if (picks.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Editor&apos;s Picks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {picks.map((pick) => {
            const post = pick.post;
            return (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className="group block border border-white/10 hover:border-white/30 transition-all duration-300"
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
                  <h3 className="text-2xl font-serif font-bold mb-2 group-hover:underline">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-white/70 mb-4">{post.excerpt}</p>
                  )}
                  <div className="text-sm text-white/60">
                    By {post.author.name || post.author.email}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

