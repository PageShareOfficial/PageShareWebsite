import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SubscriptionCenter } from "@/components/subscriptions/SubscriptionCenter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <SubscriptionCenter />
      </main>
      <Footer />
    </div>
  );
}

