'use client';
import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FotbarSlider } from '@/components/home/FotbarSlider';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { AnnouncementPopup } from '@/components/home/AnnouncementPopup';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { AnnouncementTicker } from '@/components/home/AnnouncementTicker';
import { SpecialRanksSection } from '@/components/home/SpecialRanksSection';
import { RulesSection } from '@/components/home/RulesSection';
import { TopVotersPreview } from '@/components/home/TopVotersPreview';
import { CommunitySection } from '@/components/home/CommunitySection';

export default function HomePage() {
  return (
    <PageLayout>
      <AnnouncementPopup />
      <HeroSection />
      <FotbarSlider />
      <AnnouncementBanner />
      <FeaturesSection />
      <AnnouncementTicker />
      <SpecialRanksSection />
      <RulesSection />
      <TopVotersPreview />
      <CommunitySection />
    </PageLayout>
  );
}
