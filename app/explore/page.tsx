import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ExploreFeed } from "@/components/explore/ExploreFeed";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <ExploreFeed />
      </main>
      <Footer />
    </div>
  );
}

