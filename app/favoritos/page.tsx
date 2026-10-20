import type { Metadata } from 'next';
import { FavoritesView } from '@/components/pages/FavoritesView';

export const metadata: Metadata = { title: 'Favoritos', robots: { index: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
