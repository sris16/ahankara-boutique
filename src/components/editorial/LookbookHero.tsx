import Image from "next/image";

interface LookbookHeroProps {
  image: {
    src: string;
    alt: string;
  };
  eyebrow: string;
  headline: string;
  subtext: string;
}

export function LookbookHero({ image, eyebrow, headline, subtext }: LookbookHeroProps) {
  return (
    <section
      aria-label="Editorial Campaign Hero"
      className="relative w-full h-[90vh] min-h-[600px] flex items-end justify-center overflow-hidden bg-surface"
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transition-transform duration-[3000ms] ease-out motion-reduce:transform-none motion-reduce:transition-none motion-safe:animate-in motion-safe:zoom-in-[1.05]"
        />
        {/* Editorial Scrim for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
      </div>

      {/* Editorial Text Block */}
      <div className="relative z-10 container mx-auto px-6 pb-20 md:pb-32 flex flex-col items-center text-center">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-cinematic fill-mode-both delay-150">
          <span className="inline-block mb-6 text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase text-foreground/80 bg-surface/50 backdrop-blur-md px-4 py-1.5 border border-border/40">
            {eyebrow}
          </span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tight leading-[0.95] text-foreground mb-8 text-balance whitespace-pre-line motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-12 duration-cinematic fill-mode-both delay-300">
          {headline}
        </h1>

        <p className="text-sm md:text-base lg:text-lg font-light text-foreground/80 max-w-2xl text-balance leading-relaxed tracking-wide motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-cinematic fill-mode-both delay-500">
          {subtext}
        </p>
      </div>
    </section>
  );
}
