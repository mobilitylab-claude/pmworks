import { getCollections } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Play, Filter, ArrowRight, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
    const collections = await getCollections();
    const recentCollections = collections.slice(0, 3);

    return (
        <main className="container mx-auto py-12 px-4 space-y-12">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4 animate-in zoom-in duration-700">
                    <Activity className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-black tracking-tight text-white italic">
                    JiraAnal <span className="text-blue-500">PRO</span>
                </h1>
                <p className="text-xl text-slate-400 font-medium">
                    대규모 Jira 워크로그 데이터를 가공하여 인사이트를 제공하는 <br />
                    차세대 수집 및 분석 자동화 플랫폼
                </p>
                <div className="flex gap-4 pt-6">
                    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full h-14 text-lg font-bold shadow-xl shadow-blue-600/20">
                        <Link href="/builder" className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            수집 필터 생성하기
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 rounded-full h-14 text-lg font-bold">
                        <Link href="/collections" className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            전체 이력 보기
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-400">
                            <Filter className="w-5 h-5" />
                            Smart JQL Builder
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            SQL과 유사한 인터페이스로 원하는 데이터만 정밀하게 추출합니다.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-5 h-5" />
                            Real-time Sync
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Samba 프로토콜을 이용해 리눅스 에이전트와 데이터를 실시간 동기화합니다.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-400">
                            <TrendingUp className="w-5 h-5" />
                            Advanced Analytics
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            다양한 시각화 차트와 엑셀 내보내기 기능을 제공합니다.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-slate-100 flex items-center gap-2">
                        <History className="w-6 h-6 text-blue-500" />
                        최근 수집 내역
                    </h2>
                    <Button variant="link" asChild className="text-blue-400">
                        <Link href="/collections" className="flex items-center gap-1">
                            전체 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {recentCollections.map((c) => (
                        <Card key={c.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group shadow-lg">
                            <Link href={`/collections/${c.id}`} className="flex items-center justify-between p-6">
                                <div className="space-y-1">
                                    <div className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                        {c.filter_title}
                                    </div>
                                    <div className="text-sm text-slate-500 italic">
                                        {format(new Date(c.collected_at), "yyyy-MM-dd HH:mm")} • {c.worklog_count} Logs
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </Card>
                    ))}
                </div>
            </section>
        </main>
    );
}
