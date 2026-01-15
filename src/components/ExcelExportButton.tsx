"use client"

import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExcelExportButtonProps {
    data: any[];
    fileName: string;
}

export function ExcelExportButton({ data, fileName }: ExcelExportButtonProps) {
    const exportToExcel = () => {
        if (!data || data.length === 0) {
            alert("내보낼 데이터가 없습니다.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Worklogs");

        // 파일 다운로드
        XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Button onClick={exportToExcel} variant="outline" size="sm" className="border-green-600/50 text-green-500 hover:bg-green-500/10 hover:text-green-400">
            <Download className="w-4 h-4 mr-2" /> 엑셀 다운로드
        </Button>
    );
}
