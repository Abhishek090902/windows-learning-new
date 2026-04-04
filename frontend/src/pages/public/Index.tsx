import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedMentors from '@/components/FeaturedMentors';
import SkillSpotlight from '@/components/SkillSpotlight';
import HowItWorks from '@/components/HowItWorks';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <CategoryGrid />
      <SkillSpotlight />
      <FeaturedMentors />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
