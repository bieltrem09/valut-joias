import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CollectionView } from '@/components/pages/CollectionView';

export const metadata: Metadata = {
  title: 'Coleção',
  description: 'Todas as semijoias VALUT: colares, brincos, anéis, pulseiras, conjuntos e bolsas de festa. Filtre por categoria, preço e cor da pedra.',
  alternates: { canonical: '/colecao' },
};

export default function CollectionPage() {
  return (
    <Suspense>
      <CollectionView />
    </Suspense>
  );
}
