"use client"

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ExcelExportButton } from "./ExcelExportButton";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, Calendar, Filter, XCircle } from "lucide-react";
import { Button } from "./ui/button";

interface WorklogTableProps {
    worklogs: any[];
}

export function WorklogTable({ worklogs }: WorklogTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // 필터링된 데이터
    const filteredWorklogs = useMemo(() => {
        return worklogs.filter(wl => {
            const matchesSearch =
                wl.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (wl.issue_key && wl.issue_key.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (wl.issue_summary && wl.issue_summary.toLowerCase().includes(searchTerm.toLowerCase()));

            let matchesDate = true;
            if (wl.started_at) {
                const logDate = parseISO(wl.started_at);
                if (startDate && endDate) {
                    matchesDate = isWithinInterval(logDate, {
                        start: startOfDay(parseISO(startDate)),
                        end: endOfDay(parseISO(endDate))
                    });
                } else if (startDate) {
                    matchesDate = logDate >= startOfDay(parseISO(startDate));
                } else if (endDate) {
                    matchesDate = logDate <= endOfDay(parseISO(endDate));
                }
            }

            return matchesSearch && matchesDate;
        });
    }, [worklogs, searchTerm, startDate, endDate]);

    // 합계 계산
    const totalHours = useMemo(() => {
        return filteredWorklogs.reduce((sum, wl) => sum + (wl.time_spent_seconds / 3600), 0);
    }, [filteredWorklogs]);

    const totalMM = (totalHours / 164).toFixed(2);

    const resetFilters = () => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
    };

    return (
        <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800/20 py-4 gap-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-100">
                    <Filter className="w-5 h-5 text-blue-400" />
                    수집된 워크로그 내역
                    <Badge variant="outline" className="bg-blue-400/10 text-blue-400 border-blue-400/20">
                        {filteredWorklogs.length} / {worklogs.length} Lines
                    </Badge>
                </CardTitle>

                <div className="flex flex-wrap items-center gap-3">
                    {/* 기간 필터 */}
                    <div className="flex items-center gap-2 bg-slate-950/50 p-1 px-2 rounded-md border border-slate-800 shadow-inner">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-8 w-32 bg-transparent border-none text-[11px] text-slate-300 focus-visible:ring-0 p-1 appearance-none"
                        />
                        <span className="text-slate-600 text-xs">~</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-8 w-32 bg-transparent border-none text-[11px] text-slate-300 focus-visible:ring-0 p-1 appearance-none"
                        />
                    </div>

                    {/* 작업자/이슈 검색 */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <Input
                            placeholder="작업자, 이슈, 제목 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 w-56 pl-8 bg-slate-950/50 border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 transition-colors shadow-inner"
                        />
                    </div>

                    {(searchTerm || startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-8 px-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 gap-1 border border-transparent hover:border-red-400/20"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">초기화</span>
                        </Button>
                    )}

                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <ExcelExportButton data={filteredWorklogs} fileName="JiraAnal_Results" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[650px] overflow-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="w-[120px] text-slate-400 text-[11px] font-bold uppercase tracking-wider">날짜</TableHead>
                                <TableHead className="w-[140px] text-slate-400 text-[11px] font-bold uppercase tracking-wider">작업자</TableHead>
                                <TableHead className="w-[120px] text-slate-400 text-[11px] font-bold uppercase tracking-wider">이슈 키</TableHead>
                                <TableHead className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">요약 / 댓글</TableHead>
                                <TableHead className="w-[100px] text-right text-slate-400 text-[11px] font-bold uppercase tracking-wider">시간(h)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWorklogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-500 font-medium italic">
                                        필터 조건에 부합하는 데이터가 존재하지 않습니다.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredWorklogs.map((wl) => (
                                    <TableRow key={wl.id} className="border-slate-800 hover:bg-slate-800/40 transition-all group border-b">
                                        <TableCell className="text-[11px] text-slate-400 font-mono">
                                            {wl.started_at ? format(new Date(wl.started_at), "yyyy-MM-dd") : "-"}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                                {wl.author}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-800/50 text-blue-400 border-slate-700 hover:bg-slate-700 font-mono text-[10px] px-1.5 py-0">
                                                {wl.issue_key}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-sm text-slate-300 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                                                    {wl.issue_summary}
                                                </div>
                                                <div className="text-[10px] text-slate-500 line-clamp-1 group-hover:line-clamp-none italic">
                                                    {wl.comment || "(No Comment)"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-blue-300 font-bold text-sm">
                                            {(wl.time_spent_seconds / 3600).toFixed(1)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter className="bg-slate-900 border-t-2 border-slate-800 sticky bottom-0 z-10 backdrop-blur-xl">
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={3} className="py-4">
                                    <div className="flex items-center gap-8 pl-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Filtered count</span>
                                            <span className="text-lg font-black text-slate-200 italic">{filteredWorklogs.length} <span className="text-xs font-normal not-italic text-slate-500">건</span></span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end px-4">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold mb-1">Total Effort Summary</span>
                                        <div className="h-0.5 w-12 bg-blue-500/30 mb-2 rounded-full" />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right py-4 pr-6">
                                    <div className="flex flex-col items-end">
                                        <div className="text-2xl font-black text-emerald-400 italic leading-none whitespace-nowrap drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                            {totalMM} <span className="text-xs font-bold uppercase ml-0.5 text-emerald-500/70">mm</span>
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-500 mt-1.5 font-bold">
                                            Σ {totalHours.toFixed(1)} h
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
