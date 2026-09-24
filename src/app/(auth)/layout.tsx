import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 md:py-24">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-12 text-center">
          <Link href="/" className="font-serif text-2xl tracking-[0.2em] font-semibold hover:opacity-80 transition-opacity uppercase">
            AHANKARA STUDIOS
          </Link>
        </div>
        <div className="bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
