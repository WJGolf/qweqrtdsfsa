import { imageUrl } from "@/lib/utils";

// Plain <img> keeps this working with any storage path; swap to next/image if desired.
export default function Img({ bucket, path, alt, className }: { bucket: string; path: string | null | undefined; alt: string; className?: string }) {
  const src = imageUrl(bucket, path);
  if (!src) return <div className={`bg-raised ${className ?? ""}`} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}
