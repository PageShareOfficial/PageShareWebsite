import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PostContent } from "@/components/post/PostContent";
import { PostSidebar } from "@/components/post/PostSidebar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MDXRemote } from "@/components/mdx/MDXRemote";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      },
      category: true,
      tags: {
        include: {
          tag: true,
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
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  // Get related posts
  const related = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <PostContent post={post} />
        <PostSidebar post={post} related={related} />
      </main>
      <Footer />
    </div>
  );
}

