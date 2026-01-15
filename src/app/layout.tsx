import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
    title: "JiraAnal PRO - Worklog Dashboard",
    description: "Next Generation Jira Analysis Tool",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className="dark">
            <body className="min-h-screen antialiased">
                <Navigation />
                <div className="relative">
                    {children}
                </div>
            </body>
        </html>
    );
}
