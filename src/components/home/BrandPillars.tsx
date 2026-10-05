import { Compass, ShieldCheck, Feather } from "lucide-react";

export function BrandPillars() {
  const pillars = [
    {
      icon: Compass,
      index: "01",
      title: "Architectural Drape",
      subtitle: "Geometric Proportion",
      description:
        "Every garment is developed through geometric proportion, balancing structured precision with intuitive physical ease and poise.",
    },
    {
      icon: ShieldCheck,
      index: "02",
      title: "Material Permanence",
      subtitle: "Tactile Longevity",
      description:
        "We source textiles of substantial weight and honest tactile depth, engineered to endure and patina gracefully through years of wear.",
    },
    {
      icon: Feather,
      index: "03",
      title: "Quiet Restraint",
      subtitle: "Enduring Form",
      description:
        "Rejecting fast-fashion turnover, our atelier focuses on enduring silhouettes that transcend seasonal novelty and transient trends.",
    },
  ];

  return (
    <section
      aria-labelledby="brand-pillars-heading"
      className="py-20 md:py-28 px-4 sm:px-6 container mx-auto border-t border-border/50"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 md:mb-16 gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] font-medium text-accent block mb-2 select-none">
            Studio Tenets
          </span>
          <h2
            id="brand-pillars-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground font-normal"
          >
            Mindful Design Principles
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-sm">
          Guiding disciplines established in our studio to ensure every piece possesses purpose and longevity.
        </p>
      </div>

      {/* Triptych Grid with Hairline Dividers */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60 border border-border/60 rounded-xs bg-surface/50">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.index}
              className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between group hover:bg-surface transition-colors duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs text-accent tracking-widest uppercase">
                    {pillar.index}
                  </span>
                  <div className="w-8 h-8 rounded-xs border border-border/60 flex items-center justify-center text-foreground/70 group-hover:border-accent group-hover:text-accent transition-colors duration-300">
                    <Icon className="w-4 h-4 stroke-[1.25]" />
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-2">
                  {pillar.subtitle}
                </span>

                <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground mb-4 tracking-tight">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-foreground/75 font-light leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-8 mt-8 border-t border-border/30">
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 select-none">
                  Ahankara Atelier Standard
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

