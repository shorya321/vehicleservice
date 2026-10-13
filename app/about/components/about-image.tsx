import Image, { type ImageProps } from 'next/image'

/**
 * A CMS image. Site paths (/benefits, /images) skip the optimizer: they sit
 * outside the maintenance-exempt paths, so its cookieless re-fetch would get
 * the maintenance page (same reason as the blog rail and home Cities).
 */
export function AboutImage({ src, alt, ...props }: Omit<ImageProps, 'src'> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={src.startsWith('/')} {...props} />
}
