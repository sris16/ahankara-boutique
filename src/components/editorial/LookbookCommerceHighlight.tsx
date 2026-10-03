import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LookbookCommerceHighlightProps {
  image: {
    src: string;
    alt: string;
  };
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
}

export function LookbookCommerceHighlight({
  image,
  headline,
  subtext,
  ctaText,
  ctaLink
}: LookbookCommerceHighlightProps) {
  return (
    <section className="py-24 md:py-36 bg-surface-muted/50 border-y border-border/40">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Large Heroic Edge-to-Edge feel for the highlight */}
          <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden shadow-subtle">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          {/* Commerce CTA Block */}
          <div className="flex flex-col items-start space-y-8 lg:pr-12">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground border-b border-border pb-2 inline-block">
              Shop The Campaign
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground leading-[1.05]">
              {headline}
            </h2>

            <p className="text-base text-muted-foreground font-light leading-relaxed max-w-md">
              {subtext}
            </p>

            <div className="pt-6">
              <Button
                asChild
                size="lg"
                className="uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-xs shadow-subtle hover-lift group"
              >
                <Link href={ctaLink} className="inline-flex items-center gap-3">
                  {ctaText}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
