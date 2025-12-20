import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendingTicker } from "@/components/home/TrendingTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedPost } from "@/components/home/FeaturedPost";
import { TrendingRail } from "@/components/home/TrendingRail";
import { EditorsPicks } from "@/components/home/EditorsPicks";
import { CategoryTabs } from "@/components/home/CategoryTabs";
import { ContinueReading } from "@/components/home/ContinueReading";
import { PersonalizedSection } from "@/components/home/PersonalizedSection";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TrendingTicker />
      <main>
        <HeroSection />
        <FeaturedPost />
        <TrendingRail />
        <EditorsPicks />
        <CategoryTabs />
        <ContinueReading />
        <PersonalizedSection />
      </main>
      <Footer />
    </div>
  );
}

