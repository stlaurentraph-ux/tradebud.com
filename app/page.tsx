import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { Mission, Problem } from '@/components/landing/mission-problem';
import { ProductStory, Pillars } from '@/components/landing/product-story';
import { Audience, BeyondCompliance, FinalCTA, Footer } from '@/components/landing/lower-sections';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0d1510] text-[#f0ece4] font-sans">
      <Nav />
      <Hero />
      <Mission />
      <Problem />
      <ProductStory />
      <Pillars />
      <Audience />
      <BeyondCompliance />
      <FinalCTA />
      <Footer />
    </main>
  );
}
