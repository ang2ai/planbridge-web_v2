import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { RoleProvider } from "@/lib/role-context";
import { RoleGate } from "@/components/layout/role-gate";
import { Toaster } from "sonner"; // sonner

export const metadata: Metadata = {
  title: "PlanBridge",
  description:
    "AI-powered planning & policy management for web applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <RoleProvider>
            <RoleGate>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <Header />
                  <main className="flex-1 p-6">{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </RoleGate>
          </RoleProvider>
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
