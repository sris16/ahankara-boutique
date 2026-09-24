import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="font-serif text-xl tracking-widest font-semibold inline-block mb-6 hover:opacity-80 transition-opacity">
              AHANKARA STUDIOS
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A premium fashion studio dedicated to elegance and sophisticated minimalism. Crafted for those who appreciate the quiet luxury of mindful design.
            </p>
          </div>
          
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest mb-6">Shop</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/products?sortBy=newest" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Collections</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest mb-6">Client Services</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/account" className="hover:text-foreground transition-colors">My Account</Link></li>
              <li><Link href="/account/orders" className="hover:text-foreground transition-colors">Orders</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AHANKARA STUDIOS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="opacity-50 hover:opacity-100 transition-opacity">Privacy Policy</Link>
            <Link href="/terms-of-service" className="opacity-50 hover:opacity-100 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
