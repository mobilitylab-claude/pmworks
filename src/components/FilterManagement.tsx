"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, deleteFilter, saveFilter } from "@/lib/actions-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Trash2,
    Edit3,
    X,
    FolderOpen,
    Calendar,
    Terminal,
    ChevronRight,
    SearchX,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface FilterManagementProps {
    initialFilters: Filter[];
}

export function FilterManagement({ initialFilters }: FilterManagementProps) {
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
    const router = useRouter();

    const filtered = initialFilters.filter(f =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.jql_query.toLowerCase().includes(search.toLowerCase())
    );

    const handleRename = async (filter: Filter) => {
        if (!editTitle || editTitle.trim() === filter.title) {
            setEditingId(null);
            return;
        }

        const trimmedTitle = editTitle.trim();

        // 중복 이름 체크 (관리 페이지에서도 수행)
        if (initialFilters.some(f => f.title === trimmedTitle && f.id !== filter.id)) {
            alert("이미 동일한 이름의 필터가 존재합니다.");
            return;
        }

        try {
            await saveFilter({ ...filter, title: trimmedTitle });
            setEditingId(null);
            router.refresh();
        } catch (error) {
            console.error("Rename failed:", error);
            alert("필터 이름 수정에 실패했습니다.");
        }
    };

    const handleDelete = async (filter: Filter) => {
        if (confirm(`'${filter.title}' 필터를 영구적으로 삭제하시겠습니까?`)) {
            try {
                await deleteFilter(filter.id!);
                router.refresh();
            } catch (error) {
                console.error("Delete failed:", error);
                alert("필터 삭제에 실패했습니다.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-yellow-500" />
                        필터 저장소 관리
                    </h2>
                    <p className="text-sm text-slate-400">저장된 {initialFilters.length}개의 JQL 필터를 관리합니다.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="필터 이름 또는 JQL 검색..."
                        className="pl-10 bg-slate-900 border-slate-800 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800 border-dashed py-20">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500">
                            <SearchX className="w-12 h-12 mb-4 opacity-20" />
                            <p>{search ? "검색 결과가 없습니다." : "저장된 필터가 없습니다."}</p>
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((filter) => (
                        <Card key={filter.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center mr-4 shrink-0">
                                        <Terminal className="w-5 h-5 text-blue-400" />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        {editingId === filter.id ? (
                                            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="h-9 bg-slate-800 border-blue-500/50"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRename(filter);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                />
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-500" onClick={() => handleRename(filter)}>저장</Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3
                                                        className="font-semibold text-slate-200 truncate cursor-pointer hover:text-blue-400 transition-colors"
                                                        onClick={() => setSelectedFilter(filter)}
                                                    >
                                                        {filter.title}
                                                    </h3>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            setEditingId(filter.id!);
                                                            setEditTitle(filter.title);
                                                        }}
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-start gap-4 text-[11px] text-slate-500">
                                                    <span
                                                        className="flex-1 font-mono text-blue-400/70 cursor-pointer hover:text-blue-300 break-all leading-relaxed overflow-hidden text-ellipsis"
                                                        style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFilter(filter);
                                                        }}
                                                        title={filter.jql_query}
                                                    >
                                                        {filter.jql_query}
                                                    </span>
                                                    <span className="flex items-center gap-1 shrink-0 ml-auto opacity-60 pt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {filter.created_at ? format(new Date(filter.created_at), "yyyy-MM-dd HH:mm") : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl"
                                            title="빌더에서 열기"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/builder?loadId=${filter.id}`);
                                            }}
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(filter);
                                            }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                        <div className="w-8 flex justify-center text-slate-700">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={!!selectedFilter} onOpenChange={(open) => !open && setSelectedFilter(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-400">
                            <Terminal className="w-5 h-5" />
                            {selectedFilter?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">JQL Query</h4>
                            <div className="bg-black/40 border border-slate-800 rounded-lg p-4 font-mono text-sm text-blue-300 break-all whitespace-pre-wrap">
                                {selectedFilter?.jql_query}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuration (JSON)</h4>
                            <div className="bg-black/40 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-400 overflow-x-auto">
                                <pre>{selectedFilter ? JSON.stringify(JSON.parse(selectedFilter.config_json), null, 2) : ""}</pre>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-800/50">
                            <span>ID: {selectedFilter?.id}</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                생성일: {selectedFilter?.created_at ? format(new Date(selectedFilter.created_at), "yyyy-MM-dd HH:mm:ss") : "-"}
                            </span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
