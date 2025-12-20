import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthorProfile } from "@/components/author/AuthorProfile";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const author = await prisma.user.findUnique({
    where: { id },
    include: {
      authoredPosts: {
        where: { status: "PUBLISHED" },
        include: {
          category: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
      },
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });

  if (!author) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <AuthorProfile author={author} />
      </main>
      <Footer />
    </div>
  );
}

