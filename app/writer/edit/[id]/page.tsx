import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MDXEditor } from "@/components/writer/MDXEditor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/auth/signin");
  }

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    redirect("/writer/dashboard");
  }

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/writer/dashboard");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <MDXEditor postId={id} />
      </main>
      <Footer />
    </div>
  );
}

