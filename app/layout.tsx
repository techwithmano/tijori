import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, DM_Sans, Readex_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { I18nProvider, Language } from "@/lib/i18n";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tijori (تِجوري) | Anti-Impulse Micro-Savings",
  description:
    "Lock micro-savings from your monthly allowance or salary. When impulse urges strike, your trusted Keyholder helps keep your hands off the vault.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("tijori_lang")?.value;
  const lang: Language = langCookie === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${bricolage.variable} ${dmSans.variable} ${readex.variable}`}
    >
      <body className="bg-bg text-text min-h-screen flex flex-col antialiased selection:bg-accent/20 selection:text-accent font-sans relative">
        {/* Subtle Animated Gradient Mesh Background */}
        <div className="mesh-bg-canvas" aria-hidden="true">
          <div className="mesh-blob-violet" />
          <div className="mesh-blob-lime" />
          <div className="mesh-blob-bottom" />
        </div>

        <I18nProvider initialLang={lang}>
          {/* Global Header */}
          <Header />

          {/* Main Content Area */}
          <main className="flex-1 w-full relative z-0">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
