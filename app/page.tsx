import { Hero } from '@/components/sections/Hero';
import { Marquee } from '@/components/sections/Marquee';
import { CurvedGallery } from '@/components/sections/CurvedGallery';
import { Categories } from '@/components/sections/Categories';
import { Manifesto } from '@/components/sections/Manifesto';
import { RubiMood } from '@/components/sections/RubiMood';
import { Lookbook } from '@/components/sections/Lookbook';
import { Featured } from '@/components/sections/Featured';
import { StoreSection } from '@/components/sections/StoreSection';
import { Wholesale } from '@/components/sections/Wholesale';
import { Feedbacks } from '@/components/sections/Feedbacks';

export default function Home() {
  return (
    <>
      <Hero />
      {/* Tudo depois do hero sobe por cima dele enquanto ele está pinado */}
      <div className="relative z-10">
        <Marquee />
        <CurvedGallery />
        <Categories />
        <Manifesto />
        <RubiMood />
        <Lookbook />
        <Featured />
        <StoreSection />
        <Wholesale />
        <Feedbacks />
      </div>
    </>
  );
}
