import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSessionUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Zivo — Shoes for every step", template: "%s | Zivo" },
  description: "Shop sneakers, running shoes and boots at Zivo. Free shipping over ₹999.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider userId={user?.id ?? null}>
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
