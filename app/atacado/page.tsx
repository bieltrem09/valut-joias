import type { Metadata } from 'next';
import { Wholesale } from '@/components/sections/Wholesale';
import { WholesaleForm } from '@/components/pages/WholesaleForm';

export const metadata: Metadata = {
  title: 'Atacado & Revenda',
  description: 'Revenda VALUT Semijoias: atacado & varejo, com envio para todo o Brasil.',
  alternates: { canonical: '/atacado' },
};

export default function WholesalePage() {
  return (
    <>
      <Wholesale standalone />
      <WholesaleForm />
    </>
  );
}
