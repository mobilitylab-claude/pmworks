"use client"

import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExcelExportButtonProps {
    data: any[];
    fileName: string;
    stats?: {
        overview: {
            totalHours: number;
            totalMM: number;
            authorCount: number;
            issueCount: number;
        };
        authorStats: any[];
        monthlyStats: any[];
    };
}

export function ExcelExportButton({ data, fileName, stats }: ExcelExportButtonProps) {
    const exportToExcel = () => {
        if (!data || data.length === 0) {
            alert("내보낼 데이터가 없습니다.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // 1. 개요 시트
        if (stats) {
            const overviewData = [
                ["구분", "수치", "단위"],
                ["총 투입 시간", stats.overview.totalHours, "h"],
                ["총 투입 공수 (M/M)", stats.overview.totalMM, "MM"],
                ["참여 인원", stats.overview.authorCount, "명"],
                ["관련 이슈 수", stats.overview.issueCount, "건"],
                [],
                ["* 1 M/M 기준:", 164, "시간 (20.5일 * 8시간)"]
            ];
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, "개요");

            // 2. 작업자별 통계 시트
            const authorData = [
                ["작업자ID", "이름 (표시명)", "투입시간(h)", "M/M", "비중(%)"],
                ...stats.authorStats.map(a => [
                    a.author_id,
                    a.author_display,
                    a.hours,
                    a.mm,
                    Number(((a.mm / stats.overview.totalMM) * 100).toFixed(1))
                ])
            ];
            const wsAuthor = XLSX.utils.aoa_to_sheet(authorData);
            XLSX.utils.book_append_sheet(wb, wsAuthor, "작업자별_통계");

            // 3. 월별 통계 시트
            const monthlyData = [
                ["기준월", "투입시간(h)", "M/M"],
                ...stats.monthlyStats.map(m => [m.month, m.hours, m.mm])
            ];
            const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
            XLSX.utils.book_append_sheet(wb, wsMonthly, "월별_추이");
        }

        // 4. 상세 내역 시트
        const detailedData = data.map(wl => ({
            "날짜": wl.started_at ? wl.started_at.split('T')[0] : "",
            "작업자": wl.author,
            "이슈키": wl.issue_key,
            "요약": wl.issue_summary,
            "댓글": wl.comment || "",
            "시간(h)": Number((wl.time_spent_seconds / 3600).toFixed(1))
        }));
        const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
        XLSX.utils.book_append_sheet(wb, wsDetailed, "워크로그_상세");

        // 파일 다운로드
        XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Button onClick={exportToExcel} variant="outline" size="sm" className="border-green-600/50 text-green-500 hover:bg-green-500/10 hover:text-green-400">
            <Download className="w-4 h-4 mr-2" /> 엑셀 다운로드
        </Button>
    );
}
