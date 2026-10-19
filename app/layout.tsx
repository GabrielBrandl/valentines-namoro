import type { Metadata, Viewport } from "next";
import { Cinzel, Figtree } from "next/font/google";
import { Shell } from "@/components/Shell";
import { brand } from "@/lib/brand";
import { ProductProvider } from "@/lib/product";
import { FeconProvider } from "@/lib/store";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  applicationName: brand.name,
  icons: {
    icon: [{ url: "/app-icon.jpg", type: "image/jpeg" }],
    apple: [{ url: "/app-icon.jpg", type: "image/jpeg" }],
  },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${figtree.variable} ${cinzel.variable} antialiased`}>
        <FeconProvider>
          <ProductProvider>
            <Shell>{children}</Shell>
          </ProductProvider>
        </FeconProvider>
      </body>
    </html>
  );
}
