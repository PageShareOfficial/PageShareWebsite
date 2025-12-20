import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function AdminDashboard() {
  const [postCount, userCount, commentCount, reportedComments] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.comment.findMany({
      where: { isHidden: false },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        post: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold mb-12">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{postCount}</div>
          <div className="text-white/60">Total Posts</div>
        </div>
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{userCount}</div>
          <div className="text-white/60">Total Users</div>
        </div>
        <div className="border border-white/10 p-6">
          <div className="text-3xl font-bold mb-2">{commentCount}</div>
          <div className="text-white/60">Total Comments</div>
        </div>
      </div>

      {/* Recent Comments */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold mb-6">Recent Comments</h2>
        <div className="space-y-4">
          {reportedComments.map((comment) => (
            <div key={comment.id} className="border border-white/10 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium mb-1">
                    {comment.user.name || comment.user.email}
                  </div>
                  <Link
                    href={`/post/${comment.post.slug}`}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {comment.post.title}
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-sm">
                    Hide
                  </button>
                </div>
              </div>
              <p className="text-white/90">{comment.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/pins"
            className="p-6 border border-white/10 hover:border-white/30 transition-all duration-300"
          >
            <h3 className="text-xl font-serif font-bold mb-2">Manage Pins</h3>
            <p className="text-white/70">Set hero posts and editor's picks</p>
          </Link>
          <Link
            href="/admin/categories"
            className="p-6 border border-white/10 hover:border-white/30 transition-all duration-300"
          >
            <h3 className="text-xl font-serif font-bold mb-2">Manage Categories</h3>
            <p className="text-white/70">Edit categories and descriptions</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

