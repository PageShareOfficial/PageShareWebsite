import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}

