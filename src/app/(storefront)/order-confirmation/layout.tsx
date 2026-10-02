import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmation | AHANKARA STUDIOS",
  robots: "noindex, nofollow",
};

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
