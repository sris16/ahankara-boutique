import { Compass, ShieldCheck, Feather } from "lucide-react";

export function BrandPillars() {
  const pillars = [
    {
      icon: Compass,
      label: "Discipline 01",
      title: "Architectural Craft",
      description:
        "Every garment is developed through geometric proportion, balancing structured precision with intuitive physical ease.",
    },
    {
      icon: ShieldCheck,
      label: "Discipline 02",
      title: "Material Permanence",
      description:
        "We source textiles of substantial weight and honest tactile depth, engineered to endure and patina gracefully through years of wear.",
    },
    {
      icon: Feather,
      label: "Discipline 03",
      title: "Quiet Restraint",
      description:
        "Rejecting fast-fashion turnover, our atelier focuses on enduring silhouettes that transcend seasonal novelty.",
    },
  ];

  return (
    <section
      aria-labelledby="brand-pillars-heading"
      className="py-20 md:py-28 px-4 sm:px-6 container mx-auto border-t border-border/40"
    >
      <div className="text-center mb-14 max-w-xl mx-auto">
        <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-accent block mb-2 font-sans">
          Studio Tenets
        </span>
        <h2
          id="brand-pillars-heading"
          className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground"
        >
          Mindful Design Principles
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 max-w-6xl mx-auto">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-8 sm:p-10 rounded-xs bg-surface border border-border/60 flex flex-col items-start transition-all duration-standard ease-spring hover:-translate-y-1 hover:border-border-strong hover:shadow-medium group cursor-default"
            >
              <div className="w-10 h-10 rounded-full bg-surface-muted border border-border/60 flex items-center justify-center mb-6 text-foreground/80 group-hover:border-accent/80 group-hover:text-accent transition-colors duration-standard">
                <Icon className="w-4 h-4 stroke-[1.5]" />
              </div>

              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent font-sans mb-2">
                {pillar.label}
              </span>

              <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground mb-3 tracking-tight">
                {pillar.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
