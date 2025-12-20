import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TagPage } from "@/components/tags/TagPage";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          category: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!tag) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <TagPage tag={tag} />
      </main>
      <Footer />
    </div>
  );
}

