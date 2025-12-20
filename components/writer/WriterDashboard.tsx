import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";

export async function WriterDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [drafts, published, scheduled] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId: session.user.id,
        status: "DRAFT",
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.post.findMany({
      where: {
        authorId: session.user.id,
        status: "PUBLISHED",
      },
      include: {
        _count: {
          select: {
            likes: true,
            bookmarks: true,
            comments: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.post.findMany({
      where: {
        authorId: session.user.id,
        status: "SCHEDULED",
      },
      orderBy: { scheduledFor: "asc" },
      take: 5,
    }),
  ]);

  const stats = await prisma.post.aggregate({
    where: {
      authorId: session.user.id,
      status: "PUBLISHED",
    },
    _count: true,
    _sum: {
      // We'll need to calculate views differently
    },
  });

  const totalLikes = await prisma.like.count({
    where: {
      post: {
        authorId: session.user.id,
        status: "PUBLISHED",
      },
    },
  });

  const totalBookmarks = await prisma.bookmark.count({
    where: {
      post: {
        authorId: session.user.id,
        status: "PUBLISHED",
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-serif font-bold">Writer Dashboard</h1>
        <Link
          href="/writer/new"
          className="px-6 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
        >
          New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{stats._count}</div>
          <div className="text-white/60">Published Posts</div>
        </div>
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{totalLikes}</div>
          <div className="text-white/60">Total Likes</div>
        </div>
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{totalBookmarks}</div>
          <div className="text-white/60">Total Bookmarks</div>
        </div>
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{drafts.length}</div>
          <div className="text-white/60">Drafts</div>
        </div>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6">Drafts</h2>
          <div className="space-y-4">
            {drafts.map((post) => (
              <Link
                key={post.id}
                href={`/writer/edit/${post.id}`}
                className="block border border-white/10 hover:border-white/30 p-6 transition-all duration-300"
              >
                <h3 className="text-xl font-serif font-bold mb-2">{post.title || "Untitled"}</h3>
                <div className="text-sm text-white/60">
                  Last updated {format(new Date(post.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Published */}
      {published.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6">Published</h2>
          <div className="space-y-4">
            {published.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className="block border border-white/10 hover:border-white/30 p-6 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold mb-2">{post.title}</h3>
                    <div className="text-sm text-white/60 mb-2">
                      Published {format(new Date(post.publishedAt || post.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="flex gap-4 text-sm text-white/60">
                      <span>{post._count.likes} likes</span>
                      <span>{post._count.bookmarks} bookmarks</span>
                      <span>{post._count.comments} comments</span>
                    </div>
                  </div>
                  <Link
                    href={`/writer/edit/${post.id}`}
                    className="ml-4 px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <section>
          <h2 className="text-2xl font-serif font-bold mb-6">Scheduled</h2>
          <div className="space-y-4">
            {scheduled.map((post) => (
              <Link
                key={post.id}
                href={`/writer/edit/${post.id}`}
                className="block border border-white/10 hover:border-white/30 p-6 transition-all duration-300"
              >
                <h3 className="text-xl font-serif font-bold mb-2">{post.title}</h3>
                <div className="text-sm text-white/60">
                  Scheduled for {post.scheduledFor ? format(new Date(post.scheduledFor), "MMM d, yyyy 'at' h:mm a") : "TBD"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

