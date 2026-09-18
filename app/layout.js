import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { dark } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CareerGuide AI",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
  appearance={{
    baseTheme: dark,
  }}
  localization={{
    signIn: {
      start: {
        title: "Sign in to CareerGuide AI",
        subtitle: "Continue your journey with AI-powered career guidance",
      },
    },
    signUp: {
      start: {
        title: "Create your CareerGuide AI account",
        subtitle: "Start your AI-powered career journey",
      },
    },
  }}
>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-200">
                <p>Made with ❤️ by CareerGuide AI</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
