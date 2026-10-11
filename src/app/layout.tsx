import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import TabBar from "@/components/TabBar";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acervo",
  description: "Un archivo personal de lo que te gusta y un retrato de tus gustos.",
  applicationName: "Acervo",
  appleWebApp: { capable: true, title: "Acervo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1b1713",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${newsreader.variable} ${inter.variable}`}>
      <body>
        <main className="shell">{children}</main>
        <TabBar />
        <RegisterSW />
      </body>
    </html>
  );
}
