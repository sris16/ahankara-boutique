import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-lg tracking-widest font-semibold inline-block mb-4">
              AHANKARA STUDIOS
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A premium fashion studio dedicated to elegance and sophisticated minimalism.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Shop</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Collections</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Accessories</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AHANKARA STUDIOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
