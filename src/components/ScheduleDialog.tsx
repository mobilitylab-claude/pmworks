"use client"

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Schedule, saveSchedule, deleteSchedule, getSchedules } from "@/lib/actions-status";
import { Filter, getFilters } from "@/lib/actions-filter";

interface ScheduleDialogProps {
    filterId?: number;     // Optional if creating from schedules page
    filterTitle?: string;
    scheduleId?: number;   // Optional if creating a new schedule
    isOpen: boolean;
    onClose: (refetch?: boolean) => void;
}

export function ScheduleDialog({ filterId: initialFilterId, filterTitle: initialFilterTitle, scheduleId, isOpen, onClose }: ScheduleDialogProps) {
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<Filter[]>([]);

    // Form state
    const [selectedFilterId, setSelectedFilterId] = useState<number | undefined>(initialFilterId);
    const [frequency, setFrequency] = useState<Schedule['frequency']>('DAILY');
    const [targetTime, setTargetTime] = useState("09:00");
    const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
    const [isActive, setIsActive] = useState(1);

    useEffect(() => {
        if (isOpen) {
            loadFilters();
            if (scheduleId) {
                fetchSchedule();
            } else {
                // Reset for new schedule
                setSelectedFilterId(initialFilterId);
                setFrequency('DAILY');
                setTargetTime("09:00");
                setTargetDate(new Date());
                setIsActive(1);
            }
        }
    }, [isOpen, scheduleId, initialFilterId]);

    const loadFilters = async () => {
        try {
            const data = await getFilters();
            setFilters(data);
        } catch (e) {
            console.error("Failed to load filters:", e);
        }
    };

    const fetchSchedule = async () => {
        if (!scheduleId) return;
        setLoading(true);
        try {
            const data = await getSchedules();
            const found = data.find(s => s.id === scheduleId);
            if (found) {
                setSelectedFilterId(found.filter_id);
                setFrequency(found.frequency);
                setTargetTime(found.target_time);
                if (found.target_date) setTargetDate(new Date(found.target_date));
                setIsActive(found.is_active ?? 1);
            }
        } catch (e) {
            console.error("Failed to fetch schedule detail:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFilterId) {
            alert("대상 필터를 선택해 주세요.");
            return;
        }

        try {
            setLoading(true);
            await saveSchedule({
                id: scheduleId,
                filter_id: selectedFilterId,
                frequency,
                target_time: targetTime,
                target_date: frequency === 'ONCE' ? format(targetDate || new Date(), "yyyy-MM-dd") : undefined,
                is_active: isActive
            });
            alert("스케줄이 저장되었습니다.");
            onClose(true);
        } catch (e: any) {
            alert(`저장 실패: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!scheduleId) return;
        if (!confirm("이 스케줄을 삭제하시겠습니까?")) return;

        try {
            setLoading(true);
            await deleteSchedule(scheduleId);
            alert("스케줄이 삭제되었습니다.");
            onClose(true);
        } catch (e: any) {
            alert(`삭제 실패: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const currentFilter = filters.find(f => f.id === selectedFilterId);

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-400" />
                        {scheduleId ? "스케줄 수정" : "새 수집 스케줄 등록"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">대상 필터</Label>
                        {initialFilterId && initialFilterTitle ? (
                            <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-800 text-sm font-medium text-slate-200">
                                {initialFilterTitle}
                            </div>
                        ) : (
                            <Select
                                value={selectedFilterId?.toString()}
                                onValueChange={(v: string) => setSelectedFilterId(Number(v))}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                    <SelectValue placeholder="필터를 선택하세요" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                                    {filters.map(filter => (
                                        <SelectItem key={filter.id} value={filter.id?.toString() || ""}>
                                            {filter.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">반복 주기</Label>
                            <Select
                                value={frequency}
                                onValueChange={(v: any) => setFrequency(v)}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="DAILY">매일</SelectItem>
                                    <SelectItem value="WEEKLY">매주 (월)</SelectItem>
                                    <SelectItem value="MONTHLY">매월 (1일)</SelectItem>
                                    <SelectItem value="ONCE">일회성</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">실행 시간</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="time"
                                    value={targetTime}
                                    onChange={(e) => setTargetTime(e.target.value)}
                                    className="pl-9 bg-slate-800 border-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {frequency === 'ONCE' && (
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">실행 날짜</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-slate-800 border-slate-700",
                                            !targetDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {targetDate ? format(targetDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                                    <Calendar
                                        mode="single"
                                        selected={targetDate}
                                        onSelect={setTargetDate}
                                        initialFocus
                                        className="bg-slate-900"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                        <Label className="text-xs text-slate-300">스케줄 활성화 상태</Label>
                        <Select
                            value={isActive.toString()}
                            onValueChange={(v: string) => setIsActive(Number(v))}
                        >
                            <SelectTrigger className="w-[100px] h-8 text-xs bg-slate-800 border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="1">활성</SelectItem>
                                <SelectItem value="0">비활성</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center">
                    {scheduleId ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                        </Button>
                    ) : <div />}

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onClose()} disabled={loading}>취소</Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {scheduleId ? "수정 저장" : "스케줄 등록"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
