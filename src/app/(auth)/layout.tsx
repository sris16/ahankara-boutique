import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="font-serif text-2xl tracking-widest font-semibold hover:text-muted-foreground transition-colors">
          AHANKARA STUDIOS
        </Link>
      </div>
      <div className="w-full max-w-md bg-background rounded-lg shadow-sm border p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
