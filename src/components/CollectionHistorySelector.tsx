"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { History, Calendar } from "lucide-react";

interface CollectionHistorySelectorProps {
    collections: any[];
}

export function CollectionHistorySelector({ collections }: CollectionHistorySelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentId = searchParams.get("collectionId") || (collections.length > 0 ? collections[0].id.toString() : "");

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("collectionId", value);
        router.push(`/?${params.toString()}`);
    };

    if (collections.length === 0) return null;

    return (
        <div className="flex items-center gap-3 bg-slate-800/40 p-1.5 pl-4 rounded-full border border-slate-700/50 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 text-slate-400">
                <History className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Historical Data</span>
            </div>
            <Select value={currentId} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[320px] bg-slate-900/60 border-slate-700/50 text-slate-200 h-9 rounded-full hover:bg-slate-800 transition-colors">
                    <SelectValue placeholder="수집 내역 선택" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {collections.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="hover:bg-slate-800 focus:bg-slate-800">
                            <div className="flex flex-col gap-0.5 py-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-blue-400">{c.filter_title}</span>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(c.collected_at), "yyyy-MM-dd HH:mm")}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1 italic">
                                    {c.issue_count} Issues / {c.worklog_count} Logs 수집됨
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
