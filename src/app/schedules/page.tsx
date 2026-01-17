"use client"

import { useState, useEffect } from "react";
import {
    CalendarDays,
    Clock,
    MoreHorizontal,
    Play,
    Settings2,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
    getSchedules,
    deleteSchedule,
    Schedule
} from "@/lib/actions-status";
import {
    getFilters,
    Filter
} from "@/lib/actions-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { cn } from "@/lib/utils";

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | undefined>(undefined);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sData, fData] = await Promise.all([
                getSchedules(),
                getFilters()
            ]);
            setSchedules(sData);
            setFilters(fData);
        } catch (e) {
            console.error("Failed to fetch schedules data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getFilterTitle = (filterId: number) => {
        return filters.find(f => f.id === filterId)?.title || `알 수 없는 필터 (${filterId})`;
    };

    const handleOpenNewDialog = () => {
        setSelectedScheduleId(undefined);
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (id: number) => {
        setSelectedScheduleId(id);
        setIsDialogOpen(true);
    };

    const handleDeleteDirect = async (id: number) => {
        if (!confirm("이 자동 수집 일정을 삭제하시겠습니까?")) return;

        try {
            setLoading(true);
            await deleteSchedule(id);
            alert("스케줄이 삭제되었습니다.");
            fetchData();
        } catch (e: any) {
            alert(`삭제 실패: ${e.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <CalendarDays className="w-8 h-8 text-blue-500" />
                        자동 수집 일정
                    </h1>
                    <p className="text-slate-400 mt-2">
                        등록된 필터별 자동 수집 스케줄을 관리합니다. 한 필터에 여러 주기의 스케줄을 등록할 수 있습니다.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchData}
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:text-slate-100"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        새로고침
                    </Button>
                    <Button
                        onClick={handleOpenNewDialog}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        신규 스케줄 등록
                    </Button>
                </div>
            </div>

            {loading && schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <RefreshCw className="w-10 h-10 text-slate-700 animate-spin mb-4" />
                    <p className="text-slate-500">일정 정보를 불러오는 중...</p>
                </div>
            ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <Calendar className="w-16 h-16 text-slate-800 mb-4" />
                    <h3 className="text-lg font-medium text-slate-400">등록된 자동 수집 일정이 없습니다.</h3>
                    <p className="text-slate-600 mt-2 text-sm text-center max-w-md">
                        [신규 스케줄 등록] 버튼을 클릭하여 새로운 자동 수집 일정을 추가해 보세요.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {schedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Badge className={cn(
                                            "px-2 py-0.5 text-[10px] font-bold",
                                            schedule.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                                        )}>
                                            {schedule.is_active ? "활성" : "비활성"}
                                        </Badge>
                                        <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                            {getFilterTitle(schedule.filter_id)}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <span className="font-medium text-slate-300">
                                                {schedule.frequency === 'DAILY' && "매일"}
                                                {schedule.frequency === 'WEEKLY' && "매주 (월요일)"}
                                                {schedule.frequency === 'MONTHLY' && "매월 (1일)"}
                                                {schedule.frequency === 'ONCE' && `일회성 (${schedule.target_date})`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            <span className="font-medium text-slate-300">{schedule.target_time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
                                        onClick={() => handleOpenEditDialog(schedule.id!)}
                                    >
                                        <Settings2 className="w-4 h-4 mr-2" />
                                        설정 변경
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                                        onClick={() => handleDeleteDirect(schedule.id!)}
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <div className="w-px h-8 bg-slate-800 mx-1 hidden md:block" />

                                    <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-500 bg-slate-800/20">
                                        ID: {schedule.id}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isDialogOpen && (
                <ScheduleDialog
                    scheduleId={selectedScheduleId}
                    isOpen={isDialogOpen}
                    onClose={(refetch) => {
                        setIsDialogOpen(false);
                        if (refetch) fetchData();
                    }}
                />
            )}
        </div>
    );
}
