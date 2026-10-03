import Image from "next/image";

interface LookbookNarrativeProps {
  headline: string;
  body: string;
  image?: {
    src: string;
    alt: string;
  };
  align?: "left" | "right" | "center";
}

export function LookbookNarrative({ headline, body, image, align = "left" }: LookbookNarrativeProps) {
  if (align === "center" || !image) {
    return (
      <section className="py-16 md:py-24 container mx-auto px-6 flex justify-center text-center">
        <div className="max-w-3xl">
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-8">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            {body}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 container mx-auto px-6">
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center ${align === "right" ? "lg:flex-row-reverse" : ""}`}>

        {/* Text Area */}
        <div className={`lg:col-span-5 flex flex-col justify-center ${align === "right" ? "lg:col-start-8" : "lg:col-start-1"}`}>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight text-foreground mb-6 leading-tight">
            {headline}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
            {body}
          </p>
        </div>

        {/* Image Area */}
        <div className={`lg:col-span-7 ${align === "right" ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-6"}`}>
          <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/3] overflow-hidden bg-surface-muted">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-cinematic ease-out motion-reduce:transform-none hover-lift"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
