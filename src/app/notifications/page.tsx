"use client"

import { useState, useEffect } from "react";
import {
    getNotifications,
    markAsRead,
    Notification as NotifType
} from "@/lib/actions-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, ExternalLink, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotifType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = async () => {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifs();
    }, []);

    const handleMarkAsRead = async (id: number | 'all') => {
        await markAsRead(id);
        fetchNotifs();
    };

    return (
        <main className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">알림 히스토리</h1>
                        <p className="text-slate-400 text-sm">시스템 수집 및 자동화 작업 결과에 대한 알림 목록입니다.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="bg-slate-900 border-slate-800 hover:bg-slate-800"
                        onClick={() => handleMarkAsRead('all')}
                        disabled={loading || notifications.length === 0}
                    >
                        모두 읽음 처리
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-slate-500">알림 로드 중...</div>
                ) : notifications.length === 0 ? (
                    <Card className="bg-slate-900 border-slate-800 border-dashed py-20">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500">
                            <Bell className="w-12 h-12 mb-4 opacity-20" />
                            <p>알림 내역이 비어있습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={cn(
                                "bg-slate-900 border-slate-800 transition-all hover:bg-slate-800/30 overflow-hidden",
                                !notif.is_read && "border-l-4 border-l-blue-500"
                            )}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={cn("font-bold text-lg", !notif.is_read ? "text-white" : "text-slate-300")}>
                                                {notif.title}
                                            </h3>
                                            {!notif.is_read && (
                                                <Badge className="bg-blue-600 text-[10px] h-5">NEW</Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-400 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(notif.created_at), "yyyy년 MM월 dd일 HH:mm:ss", { locale: ko })}
                                            </span>
                                            {notif.collection_id && (
                                                <Link
                                                    href={`/collections/${notif.collection_id}`}
                                                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-medium"
                                                >
                                                    수집 결과 바로가기 <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    {!notif.is_read && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
                                            onClick={() => handleMarkAsRead(notif.id)}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            읽음
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </main>
    );
}
