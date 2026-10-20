import type { Metadata } from 'next';
import { AboutView } from '@/components/pages/AboutView';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'VALUT Semijoias: semijoia que encanta. Loja física, atacado & varejo e envio para todo o Brasil.',
  alternates: { canonical: '/sobre' },
};

export default function AboutPage() {
  return <AboutView />;
}
