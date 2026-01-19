"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Settings, Database, FolderOpen, Bell, Check, ExternalLink, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import {
    getNotifications,
    markAsRead,
    Notification as NotifType
} from "@/lib/actions-status";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const navItems = [
    { name: "필터 빌더", href: "/builder", icon: Settings },
    { name: "수집 이력", href: "/collections", icon: Database },
    { name: "필터 관리", href: "/filters", icon: FolderOpen },
    { name: "자동 수집 일정", href: "/schedules", icon: CalendarDays },
    { name: "사용자 관리", href: "/settings/users", icon: Users },
];

export function Navigation() {
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<NotifType[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifs = async () => {
        try {
            const data = await getNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
                const count = data.filter(n => n && !n.is_read).length;
                setUnreadCount(count);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (e) {
            console.error("fetchNotifs failed:", e);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchNotifs();
        const timer = setInterval(() => {
            fetchNotifs().catch(console.error);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleMarkAsRead = async (id: number | 'all') => {
        try {
            await markAsRead(id);
            await fetchNotifs();
        } catch (e) {
            console.error("handleMarkAsRead failed:", e);
        }
    };

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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                                    <Bell className="w-5 h-5" />
                                    {(unreadCount || 0) > 0 && (
                                        <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] bg-red-600 hover:bg-red-500">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-800 shadow-2xl" align="end">
                                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                                    <h3 className="text-sm font-bold text-slate-200">알림</h3>
                                    {(unreadCount || 0) > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] text-blue-400 hover:text-blue-300"
                                            onClick={() => handleMarkAsRead('all')}
                                        >
                                            전체 읽음
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {(!Array.isArray(notifications) || notifications.length === 0) ? (
                                        <div className="p-8 text-center text-slate-500 text-xs">
                                            알림이 없습니다.
                                        </div>
                                    ) : (
                                        notifications.map((notif) => notif && (
                                            <div
                                                key={notif.id}
                                                className={cn(
                                                    "p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group relative",
                                                    !notif.is_read && "bg-blue-500/5"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={cn("text-xs font-bold", !notif.is_read ? "text-blue-400" : "text-slate-300")}>
                                                        {notif.title}
                                                    </span>
                                                    {!notif.is_read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notif.id)}
                                                            className="text-slate-500 hover:text-blue-400 p-0.5 rounded-full hover:bg-slate-700 transition-colors"
                                                            title="읽음 처리"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-600">
                                                        {notif.created_at ? format(new Date(notif.created_at), "yyyy-MM-dd HH:mm", { locale: ko }) : '-'}
                                                    </span>
                                                    {notif.collection_id && (
                                                        <Link
                                                            href={`/collections/${notif.collection_id}`}
                                                            className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                                                            onClick={async () => {
                                                                if (!notif.is_read) await handleMarkAsRead(notif.id);
                                                            }}
                                                        >
                                                            상세보기 <ExternalLink className="w-2.5 h-2.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 bg-slate-800/30 text-center">
                                    <Link
                                        href="/notifications"
                                        className="text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors"
                                    >
                                        전체 알림 히스토리 보기
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                            v2.3.1 Stable
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
