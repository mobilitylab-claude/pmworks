"use client"

import { useEffect, useState } from "react";
import { getHistoryActions, deleteCollections } from "@/lib/actions-status";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { History, Play, CheckCircle2, Trash2, Calendar, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface HistoryListProps {
    initialCollections: any[];
}

export default function HistoryList({ initialCollections }: HistoryListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [collections, setCollections] = useState<any[]>(initialCollections);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const startDate = searchParams.get('startDate') || "";
    const endDate = searchParams.get('endDate') || "";

    // 필터 변경 시 데이터 재로드
    useEffect(() => {
        const load = async () => {
            const data = await getHistoryActions(startDate, endDate);
            setCollections(data);
            setSelectedIds([]);
        };
        // 초기 렌더링 시에는 props로 받은 데이터를 사용하고, 
        // startDate나 endDate가 있을 때만 다시 가져옴 (또는 항상 가져와도 무방)
        if (startDate || endDate) {
            load();
        } else {
            setCollections(initialCollections);
        }
    }, [startDate, endDate, initialCollections]);

    const formatKST = (utcString: string) => {
        try {
            const utcDate = new Date(utcString.replace(' ', 'T') + 'Z');
            return format(utcDate, "yyyy-MM-dd HH:mm:ss");
        } catch (e) {
            return utcString;
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(collections.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length}건의 히스토리를 삭제하시겠습니까?\n이슈 및 워크로그 데이터도 함께 삭제됩니다.`)) return;

        setIsDeleting(true);
        try {
            await deleteCollections(selectedIds);
            const data = await getHistoryActions(startDate, endDate);
            setCollections(data);
            setSelectedIds([]);
            alert("삭제되었습니다.");
        } catch (e: any) {
            alert("삭제 중 오류 발생: " + e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.push(`/collections?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/collections');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <History className="w-8 h-8 text-blue-500" />
                        Collection History
                    </h1>
                    <p className="text-slate-400">
                        과거 수집된 모든 데이터 이력 및 상태를 관리합니다. (KST 시간 기준)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <Input
                            type="date"
                            className="w-40 bg-slate-950 border-slate-800 text-slate-200 h-9"
                            value={startDate}
                            onChange={(e) => updateFilter('startDate', e.target.value)}
                        />
                        <span className="text-slate-600">~</span>
                        <Input
                            type="date"
                            className="w-40 bg-slate-950 border-slate-800 text-slate-200 h-9"
                            value={endDate}
                            onChange={(e) => updateFilter('endDate', e.target.value)}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-300">
                            <X className="w-4 h-4 mr-1" /> 필터 해제
                        </Button>
                    )}
                </div>
            </div>

            {collections.length > 0 && (
                <div className="flex items-center justify-between bg-slate-900/30 p-2 px-4 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
                            <Checkbox
                                id="select-all"
                                checked={selectedIds.length === collections.length && collections.length > 0}
                                onCheckedChange={(c) => handleSelectAll(!!c)}
                            />
                            <label htmlFor="select-all" className="text-sm text-slate-400 cursor-pointer select-none">전체 선택</label>
                        </div>
                        {selectedIds.length > 0 && (
                            <span className="text-sm font-medium text-blue-400">
                                {selectedIds.length}개 선택됨
                            </span>
                        )}
                    </div>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            선택 삭제
                        </Button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {collections.length === 0 ? (
                    <Card className="bg-slate-900 border-slate-800 border-dashed">
                        <CardContent className="py-20 text-center text-slate-500">
                            {(startDate || endDate) ? "필터링된 조건에 해당하는 이력이 없습니다." : "아직 수집된 이력이 없습니다. 빌더에서 첫 수집을 시작해 보세요."}
                        </CardContent>
                    </Card>
                ) : (
                    collections.map((c) => (
                        <div key={c.id} className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                                <Checkbox
                                    checked={selectedIds.includes(c.id)}
                                    onCheckedChange={(checked) => handleSelectOne(c.id, !!checked)}
                                />
                            </div>
                            <Card className={cn(
                                "bg-slate-900 border-slate-800 hover:border-slate-700 transition-all pl-12",
                                selectedIds.includes(c.id) ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : ""
                            )}>
                                <CardContent className="p-0">
                                    <Link href={`/collections/${c.id}`} className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center",
                                                c.status === 'DONE' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {c.status === 'DONE' ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-6 h-6 animate-pulse" />}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                                    {c.filter_title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 font-mono">
                                                    <span>{formatKST(c.collected_at)}</span>
                                                    <span>•</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter border-slate-700 bg-slate-800/50">
                                                        ID: {c.id}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden md:block">
                                                <div className="text-sm font-semibold text-slate-300">{c.issue_count} Issues</div>
                                                <div className="text-xs text-slate-500">{c.worklog_count} Worklogs</div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
