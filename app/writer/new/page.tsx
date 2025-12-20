import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MDXEditor } from "@/components/writer/MDXEditor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "AUTHOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <MDXEditor />
      </main>
      <Footer />
    </div>
  );
}

