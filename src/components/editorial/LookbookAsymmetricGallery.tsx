import Image from "next/image";

interface LookbookAsymmetricGalleryProps {
  images: {
    src: string;
    alt: string;
  }[];
  caption?: string;
}

export function LookbookAsymmetricGallery({ images, caption }: LookbookAsymmetricGalleryProps) {
  if (!images || images.length < 2) return null;

  return (
    <section className="py-16 md:py-24 container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">

        {/* Left Image: Smaller, offset, floating */}
        <div className="md:col-span-5 md:col-start-1 md:mt-16">
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted shadow-subtle group">
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-[1500ms] ease-luxury motion-reduce:transform-none motion-safe:group-hover:scale-105"
            />
          </div>
        </div>

        {/* Right Image: Taller, prominent */}
        <div className="md:col-span-6 md:col-start-7">
          <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[2/3] overflow-hidden bg-surface-muted shadow-subtle group">
            <Image
              src={images[1].src}
              alt={images[1].alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1500ms] ease-luxury motion-reduce:transform-none motion-safe:group-hover:scale-105"
            />
          </div>
        </div>

      </div>

      {/* Optional Editorial Caption */}
      {caption && (
        <div className="mt-12 md:mt-20 flex justify-end md:pr-12">
          <p className="text-xs md:text-sm font-serif italic text-muted-foreground max-w-sm text-right">
            {caption}
          </p>
        </div>
      )}
    </section>
  );
}
