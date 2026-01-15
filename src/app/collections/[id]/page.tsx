import { getDetailedWorklogs, getStats, getCollections } from "@/lib/db";
import { WorklogTable } from "@/components/WorklogTable";
import { AuthorChart, DailyChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users as UsersIcon, FileText, Calendar, ArrowLeft, BarChart3 } from "lucide-react";
import JQLWidget from "@/components/JQLWidget";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function CollectionDetailPage({
    params
}: {
    params: { id: string }
}) {
    const id = parseInt(params.id);
    const stats = await getStats(id);
    const worklogs = await getDetailedWorklogs(id) || [];
    const allCollections = await getCollections();
    const currentCollection = allCollections.find(c => c.id === id);

    if (!stats || !currentCollection) {
        return notFound();
    }

    return (
        <main className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link href="/collections" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" />
                        이력 목록으로 돌아가기
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
                        {currentCollection.filter_title}
                    </h1>
                    <p className="text-slate-500 flex items-center gap-2 text-sm italic">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(currentCollection.collected_at), "yyyy년 MM월 dd일 HH시 mm분 ss초")} 수집됨
                    </p>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
                <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-16 h-16" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Input (M/M)</CardTitle>
                        <Clock className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-100 italic">{stats.overview.totalMM} MM</div>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">({stats.overview.totalHours} hours total)</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <UsersIcon className="w-16 h-16" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-100 italic">{stats.overview.authorCount}명</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText className="w-16 h-16" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Issues</CardTitle>
                        <FileText className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-100 italic">{stats.overview.issueCount}건</div>
                    </CardContent>
                </Card>
            </div>

            {/* JQL 쿼리 위젯 (강조) */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-75 shadow-2xl">
                <JQLWidget jql={currentCollection.jql_query} />
            </div>

            {/* 시각화 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-800/20 border-b border-slate-800/50 py-4 flex flex-row items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-widest">작업자별 투입 비율 (h & M/M)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <AuthorChart data={stats?.authorStats || []} />
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-800/20 border-b border-slate-800/50 py-4 flex flex-row items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-widest">월별 추이 (h & M/M)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <DailyChart data={stats?.monthlyStats || []} />
                    </CardContent>
                </Card>
            </section>

            {/* 상세 테이블 */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <WorklogTable worklogs={worklogs} />
            </section>
        </main>
    );
}
