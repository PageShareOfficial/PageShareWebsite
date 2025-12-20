import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendingPage } from "@/components/trending/TrendingPage";
import { prisma } from "@/lib/prisma";

export default async function Trending() {
  const trending = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          likes: true,
          bookmarks: true,
          comments: true,
        },
      },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { publishedAt: "desc" },
    ],
    take: 30,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <TrendingPage posts={trending} />
      </main>
      <Footer />
    </div>
  );
}

