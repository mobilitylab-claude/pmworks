"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Settings, Database, FolderOpen } from "lucide-react";

const navItems = [
    { name: "필터 빌더", href: "/builder", icon: Settings },
    { name: "수집 이력", href: "/collections", icon: Database },
    { name: "필터 관리", href: "/filters", icon: FolderOpen },
    { name: "사용자 관리", href: "/settings/users", icon: Users },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                                JiraAnal PRO
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-slate-800 text-blue-400"
                                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                            v2.0.0 Stable
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
