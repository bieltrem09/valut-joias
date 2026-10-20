import Image, { ImageProps } from 'next/image';
import { media, MediaKey } from '@/data/media.generated';

type Props = Omit<ImageProps, 'src' | 'width' | 'height' | 'alt'> & { k: MediaKey; alt: string; fill?: boolean };

/** next/image ligado ao manifesto gerado (dimensões + blur placeholder). */
export function Media({ k, alt, fill, sizes, className, ...rest }: Props) {
  const m = media[k];
  const blur = m.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: m.blurDataURL } : {};
  if (fill) return <Image src={m.src} alt={alt} fill sizes={sizes ?? '100vw'} className={className} {...blur} {...rest} />;
  return <Image src={m.src} alt={alt} width={m.width} height={m.height} sizes={sizes ?? '100vw'} className={className} {...blur} {...rest} />;
}
