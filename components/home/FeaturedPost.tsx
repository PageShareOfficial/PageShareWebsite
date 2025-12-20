import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export async function FeaturedPost() {
  const featured = await prisma.postPin.findFirst({
    where: { position: "HERO" },
    include: {
      post: {
        include: {
          author: true,
          category: true,
        },
      },
    },
  });

  if (!featured) {
    // Get most recent published post
    const latest = await prisma.post.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        author: true,
        category: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    if (!latest) return null;

    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-8">Featured Story</h2>
          <Link href={`/post/${latest.slug}`} className="block group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {latest.coverImage && (
                <div className="relative aspect-video overflow-hidden border border-white/10">
                  <Image
                    src={latest.coverImage}
                    alt={latest.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="text-sm text-white/60 mb-2">
                  {latest.category?.name} • {new Date(latest.publishedAt || latest.createdAt).toLocaleDateString()}
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4 group-hover:underline">
                  {latest.title}
                </h3>
                {latest.excerpt && (
                  <p className="text-white/70 text-lg mb-4">{latest.excerpt}</p>
                )}
                <div className="text-sm text-white/60">
                  By {latest.author.name || latest.author.email}
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  const post = featured.post;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Featured Story</h2>
        <Link href={`/post/${post.slug}`} className="block group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {post.coverImage && (
              <div className="relative aspect-video overflow-hidden border border-white/10">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="text-sm text-white/60 mb-2">
                {post.category?.name} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
              </div>
              <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4 group-hover:underline">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-white/70 text-lg mb-4">{post.excerpt}</p>
              )}
              <div className="text-sm text-white/60">
                By {post.author.name || post.author.email}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

