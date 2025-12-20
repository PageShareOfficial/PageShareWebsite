import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TagsList } from "@/components/tags/TagsList";
import { prisma } from "@/lib/prisma";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <TagsList tags={tags} />
      </main>
      <Footer />
    </div>
  );
}

