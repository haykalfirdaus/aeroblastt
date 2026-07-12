import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FotbarSlider } from '@/components/home/FotbarSlider';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { GallerySlider } from '@/components/home/GallerySlider';
import { AnnouncementTicker } from '@/components/home/AnnouncementTicker';
import { SpecialRanksSection } from '@/components/home/SpecialRanksSection';
import { RulesSection } from '@/components/home/RulesSection';
import { TopVotersPreview } from '@/components/home/TopVotersPreview';
import { CommunitySection } from '@/components/home/CommunitySection';

export default function HomePage() {
  return (
    <PageLayout>
      <HeroSection />
      <FotbarSlider />
      {/* Announcement banner: sits between hero area and features */}
      <AnnouncementBanner />
      <FeaturesSection />
      {/* Gallery with a ticker divider below it */}
      <GallerySlider />
      <AnnouncementTicker />
      <SpecialRanksSection />
      <RulesSection />
      <TopVotersPreview />
      <CommunitySection />
    </PageLayout>
  );
}
