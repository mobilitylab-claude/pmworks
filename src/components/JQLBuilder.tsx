"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@/lib/actions-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    PlusCircle,
    Copy,
    Save,
    Play,
    Terminal,
    FolderOpen,
    Import,
    X,
    XCircle,
    Search,
    ChevronDown,
    Users,
    Settings,
    Edit3,
    CopyPlus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Condition,
    Filter,
    FilterConfig,
    getFilters,
    saveFilter,
    deleteFilter,
    triggerCollection
} from "@/lib/actions-filter";
import {
    getCollectionStatus,
    getCollectionLogs,
    CollectionStatus,
    CollectionLog
} from "@/lib/actions-status";
import { Progress } from "@/components/ui/Progress";

// 로컬에서 렌더링 최적화를 위해 사용하는 확장 타입
interface ExtendedCondition extends Condition {
    _forceRender?: number;
}

const FIELD_OPTIONS = [
    { label: "worklogAuthor", value: "worklogAuthor" },
    { label: "worklogDate", value: "worklogDate" },
    { label: "project", value: "project" },
    { label: "issuetype", value: "issuetype" },
    { label: "parent", value: "parent" },
    { label: "updatedDate", value: "updatedDate" },
    { label: "createdDate", value: "createdDate" },
    { label: "resolution", value: "resolution" },
    { label: "text", value: "text" },
    { label: "issueFunction", value: "issueFunction" },
    { label: "key", value: "key" },
    { label: "summary", value: "summary" },
    { label: "comment", value: "comment" },
    { label: "custom (수동 입력)", value: "custom" },
];

const OPERATORS: Record<string, { label: string, value: string }[]> = {
    worklogAuthor: [{ label: "포함 (IN)", value: "in" }, { label: "제외 (NOT IN)", value: "not in" }],
    worklogDate: [{ label: "이후 (>=)", value: ">=" }, { label: "이전 (<=)", value: "<=" }, { label: "초과 (>)", value: ">" }, { label: "미만 (<)", value: "<" }, { label: "정확히 (=)", value: "=" }],
    updatedDate: [{ label: "이후 (>=)", value: ">=" }, { label: "이전 (<=)", value: "<=" }, { label: "초과 (>)", value: ">" }, { label: "미만 (<)", value: "<" }, { label: "정확히 (=)", value: "=" }],
    createdDate: [{ label: "이후 (>=)", value: ">=" }, { label: "이전 (<=)", value: "<=" }, { label: "초과 (>)", value: ">" }, { label: "미만 (<)", value: "<" }, { label: "정확히 (=)", value: "=" }],
    project: [{ label: "일치 (=)", value: "=" }, { label: "불일치 (!=)", value: "!=" }, { label: "포함 (IN)", value: "in" }],
    issuetype: [{ label: "일치 (=)", value: "=" }, { label: "포함 (IN)", value: "in" }],
    parent: [{ label: "일치 (=)", value: "=" }, { label: "불일치 (!=)", value: "!=" }],
    resolution: [{ label: "일치 (=)", value: "=" }, { label: "불일치 (!=)", value: "!=" }],
    text: [{ label: "포함 (~)", value: "~" }, { label: "미포함 (!~)", value: "!~" }],
    issueFunction: [{ label: "포함 (IN)", value: "in" }],
    summary: [{ label: "포함 (~)", value: "~" }, { label: "미포함 (!~)", value: "!~" }],
    comment: [{ label: "포함 (~)", value: "~" }],
    key: [{ label: "일치 (=)", value: "=" }, { label: "포함 (IN)", value: "in" }],
    custom: [{ label: "수동 입력", value: "none" }],
};

// JQL 예시 프리셋 제거 (사용자 요청)

interface JQLBuilderProps {
    users: User[];
    savedFilters: Filter[];
}

export function JQLBuilder({ users, savedFilters }: JQLBuilderProps) {
    const [title, setTitle] = useState("새 필터");
    const [conditions, setConditions] = useState<ExtendedCondition[]>([
        { id: Math.random().toString(), field: "worklogAuthor", operator: "in", value: [], logic: "AND" }
    ]);
    const [generatedJQL, setGeneratedJQL] = useState("");
    const [isLoadOpen, setIsLoadOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [partFilter, setPartFilter] = useState("all");
    const [filterSearch, setFilterSearch] = useState("");
    const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null);
    const [logs, setLogs] = useState<CollectionLog[]>([]);
    const [isMonitorOpen, setIsMonitorOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL 파라미터를 통해 필터를 자동으로 로드합니다.
    useEffect(() => {
        const loadId = searchParams.get('loadId');
        if (loadId && savedFilters.length > 0) {
            const filterToLoad = savedFilters.find(f => f.id?.toString() === loadId);
            if (filterToLoad) {
                loadFilter(filterToLoad);
                // 파라미터 처리 후 중복 로딩 방지를 위해 URL 정리 (선택 사항)
                // window.history.replaceState({}, '', '/builder');
            }
        }
    }, [searchParams, savedFilters]);

    const loadFilter = (filter: Filter) => {
        setTitle(filter.title);
        try {
            const config: FilterConfig = JSON.parse(filter.config_json);
            setConditions(config.conditions);
        } catch (e) {
            console.error("Failed to parse filter config", e);
            // 과거 버전 호환성 유지
            setConditions([]);
        }
        setIsLoadOpen(false);
    };

    // JQL 생성 로직 고도화 (조건 간 논리 연산 반영)
    useEffect(() => {
        let jqlParts: string[] = [];

        conditions.forEach((c, idx) => {
            let part = "";
            if (!c.field || !c.operator) return;

            const val = typeof c.value === 'string' ? c.value.trim() : c.value;

            if (c.field === "custom") {
                // 수동 입력 필드의 경우 값 자체를 쿼리 파트로 사용
                if (typeof val === 'string' && val) {
                    part = val;
                }
            } else if (c.field === "worklogAuthor") {
                const authors = Array.isArray(val) ? val : [];
                if (authors.length > 0) {
                    part = `${c.field} ${c.operator} (${authors.map((a: string) => `"${a.trim()}"`).join(", ")})`;
                }
            } else if (c.field === "worklogDate" || c.field === "updatedDate" || c.field === "createdDate") {
                if (val && typeof val === 'string') {
                    // 날짜 형식이면 포맷팅, 아니면 그대로 (상대 날짜 대응)
                    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
                        try {
                            const dateStr = format(new Date(val), "yyyy-MM-dd");
                            part = `${c.field} ${c.operator} "${dateStr}"`;
                        } catch (e) {
                            part = `${c.field} ${c.operator} "${val}"`;
                        }
                    } else {
                        part = `${c.field} ${c.operator} "${val}"`;
                    }
                }
            } else if (c.operator === "in" || c.operator === "not in") {
                if (typeof val === "string") {
                    // issueFunction이거나 함수 호출 형태(ex: functionName(...))인 경우 그대로 사용
                    if (c.field === "issueFunction" || /^[a-zA-Z]+\(.*\)$/.test(val)) {
                        part = `${c.field} ${c.operator} ${val}`;
                    } else {
                        // 괄호가 있으면 제거 후 콤마로 분리하여 개별 항목 따옴표 처리
                        const cleanVal = val.replace(/^\(|\)$/g, "").trim();
                        if (cleanVal.includes(",")) {
                            const items = cleanVal.split(",").map(v => `"${v.trim()}"`).join(", ");
                            part = `${c.field} ${c.operator} (${items})`;
                        } else {
                            part = `${c.field} ${c.operator} ("${cleanVal}")`;
                        }
                    }
                } else if (Array.isArray(val)) {
                    part = `${c.field} ${c.operator} (${val.map(v => `"${v.toString().trim()}"`).join(", ")})`;
                }
            } else if (Array.isArray(val)) {
                if (val.length > 0) {
                    const subLogic = c.operator.includes("!") ? " AND " : " OR ";
                    part = "(" + val.map((v: string) => `${c.field} ${c.operator} "${v.toString().trim()}"`).join(subLogic) + ")";
                }
            } else if (val) {
                part = `${c.field} ${c.operator} "${val}"`;
            }

            if (part) {
                if (jqlParts.length > 0) {
                    // 이전 조건의 logic을 가져와 결합
                    const prevLogic = conditions[idx - 1]?.logic || "AND";
                    jqlParts.push(prevLogic);
                }
                jqlParts.push(part);
            }
        });

        setGeneratedJQL(jqlParts.join(" "));
    }, [conditions]);

    // 1. 초기 로드 시 수집 상태 확인 (한 번만 실행)
    useEffect(() => {
        const checkInitialStatus = async () => {
            const status = await getCollectionStatus();
            setCollectionStatus(status);
            if (status.status === "RUNNING") {
                setIsMonitorOpen(true);
            }
        };
        checkInitialStatus();
    }, []);

    // 2. 수집 상태 모니터링 폴링
    useEffect(() => {
        let interval: any;
        const isRunning = collectionStatus?.status === "RUNNING";

        const fetchStatus = async () => {
            const status = await getCollectionStatus();
            setCollectionStatus(status);

            if (status.status === "RUNNING") {
                const recentLogs = await getCollectionLogs(5);
                setLogs(recentLogs);
            } else if (status.status === "DONE" || status.status === "ERROR") {
                const finalLogs = await getCollectionLogs(10);
                setLogs(finalLogs);
                // 완료나 에러 시에도 상태가 브라우저에 한 번은 찍히도록 유도
                if (interval) {
                    clearInterval(interval);
                }
            }
        };

        if (isMonitorOpen || isRunning) {
            fetchStatus();
            interval = setInterval(fetchStatus, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMonitorOpen, collectionStatus?.status === "RUNNING"]);

    const addCondition = () => {
        setConditions([...conditions, {
            id: Math.random().toString(),
            field: "worklogAuthor",
            operator: "in",
            value: [],
            logic: "AND"
        }]);
    };

    const removeCondition = (id: string) => {
        if (conditions.length > 1) {
            setConditions(conditions.filter(c => c.id !== id));
        }
    };

    const updateCondition = (id: string, updates: Partial<ExtendedCondition>) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleSave = async () => {
        let filterName = title;

        // "새 필터" 이거나 기존 필터 목록에 없는 경우 이름을 묻습니다.
        if (title === "새 필터") {
            const promptedName = prompt("저장할 필터의 이름을 입력하세요:", "");
            if (!promptedName) return;
            filterName = promptedName;
        } else {
            if (!confirm(`'${title}' 필터의 변경사항을 저장하시겠습니까?`)) return;
        }

        const existingFilter = savedFilters.find(f => f.title === filterName);

        const filter: Filter = {
            id: existingFilter?.id,
            title: filterName,
            jql_query: generatedJQL,
            config_json: JSON.stringify({ conditions })
        };
        await saveFilter(filter);
        alert("필터가 저장되었습니다.");
        setTitle(filterName);
        router.refresh();
    };

    const handleSaveAs = async () => {
        const filterName = prompt("다른 이름으로 저장할 필터의 이름을 입력하세요:", title + "_복사");
        if (!filterName) return;

        if (savedFilters.some(f => f.title === filterName)) {
            alert("동일한 이름의 필터가 이미 존재합니다. 다른 이름을 사용해 주세요.");
            return;
        }

        const filter: Filter = {
            title: filterName,
            jql_query: generatedJQL,
            config_json: JSON.stringify({ conditions })
        };
        await saveFilter(filter);
        alert("새 필터로 저장되었습니다.");
        setTitle(filterName);
        router.refresh();
    };

    const handleExecute = async () => {
        if (!generatedJQL) {
            alert("생성된 JQL이 없습니다.");
            return;
        }

        const shouldSave = confirm("데이터 수집을 시작하기 전에 현재 필터 설정을 저장하시겠습니까?\n(저장하지 않으면 나중에 이 설정을 다시 불러올 수 없습니다)");

        if (shouldSave) {
            const filterName = prompt("저장할 필터의 이름을 입력하세요:", title);
            if (filterName) {
                if (savedFilters.some(f => f.title === filterName)) {
                    alert("동일한 이름의 필터가 이미 존재합니다. 다른 이름을 사용해 주세요.");
                    return;
                }
                const filter: Filter = {
                    title: filterName,
                    jql_query: generatedJQL,
                    config_json: JSON.stringify({ conditions })
                };
                await saveFilter(filter);
                setTitle(filterName);
                router.refresh();
                alert("필터가 저장되었습니다. 수집을 시작합니다.");
            } else {
                alert("저장이 취소되었습니다. 수집을 중단합니다.");
                return;
            }
        } else {
            if (!confirm("저장하지 않고 수집을 시작하시겠습니까?")) {
                return;
            }
        }

        await triggerCollection(generatedJQL, title, { conditions });
        setIsMonitorOpen(true);
        setCollectionStatus((prev: CollectionStatus | null) => prev ? { ...prev, status: "RUNNING" } as CollectionStatus : null);
    };

    const handleImportJQL = () => {
        if (!importText) return;

        try {
            // JQL 파싱 엔진 (AND로 구분된 조건 분해)
            const andParts = importText.split(/\s+AND\s+/i);
            const newConditions: ExtendedCondition[] = [];

            andParts.forEach(part => {
                const trimmed = part.trim();
                if (!trimmed) return;

                // 필드, 연산자, 값을 정규식으로 추출
                const match = trimmed.match(/^([a-zA-Z]+)\s*(=|!=|>=|<=|>|<|~|!~|in|not\s+in)\s*(.+)$/i);
                if (match) {
                    let field = match[1].trim();
                    const operator = match[2].trim().toLowerCase();
                    let valueStr = match[3].trim();

                    let value: any = valueStr;
                    // 괄호 묶음 (IN 절 등) 처리
                    if (valueStr.startsWith("(") && valueStr.endsWith(")")) {
                        value = valueStr.slice(1, -1).split(",").map(v => v.trim().replace(/^['"]|['"]$/g, ""));
                    } else {
                        // 따옴표 제거
                        value = valueStr.replace(/^['"]|['"]$/g, "");
                    }

                    // 지원하지 않는 필드인 경우 custom으로 처리
                    const isSupported = FIELD_OPTIONS.some(opt => opt.value === field);

                    newConditions.push({
                        id: Math.random().toString(),
                        field: (isSupported ? field : "custom") as any,
                        operator: (isSupported ? operator : "none") as any,
                        value: isSupported ? value : trimmed, // 수동 입력은 원문 그대로
                        logic: "AND"
                    });
                } else {
                    // 정규식에 매치되지 않는 복잡한 구문도 custom으로 처리
                    newConditions.push({
                        id: Math.random().toString(),
                        field: "custom" as any,
                        operator: "none" as any,
                        value: trimmed,
                        logic: "AND"
                    });
                }
            });

            if (newConditions.length > 0) {
                setConditions(newConditions);
                alert("JQL이 파싱되어 빌더에 적용되었습니다.");
                setIsImportOpen(false);
            } else {
                throw new Error("Invalid JQL");
            }
        } catch (e) {
            setConditions([{
                id: "manual-" + Math.random(),
                field: "text" as any,
                operator: "~" as any,
                value: importText,
                logic: "AND"
            }]);
            alert("JQL 자동 파싱에 실패하여 수동 텍스트 모드로 적용했습니다.");
            setIsImportOpen(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
            {/* 좌측: 빌더 설정 */}
            <Card className="lg:col-span-3 bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50" />
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800/50">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-blue-400" />
                            {title === "새 필터" ? "JQL 필터 빌더" : title}
                        </CardTitle>
                        {title !== "새 필터" ? (
                            <div className="flex items-center gap-2 px-7">
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">활성 필터</span>
                                <span className="text-xs text-slate-400 font-medium">{title}</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-500 font-sans px-7">복잡한 Jira 쿼리를 직관적으로 구성하세요.</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300">
                                    <FolderOpen className="w-4 h-4 mr-2 text-yellow-500" /> 필터 불러오기
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5 text-yellow-500" />
                                        저장된 필터 불러오기
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="relative mt-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        placeholder="필터 이름으로 검색..."
                                        className="bg-slate-800 border-slate-700 pl-10 h-10 text-sm"
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 mt-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                                    {savedFilters.filter(f => f.title.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
                                        <p className="text-center py-20 text-slate-500 text-sm">
                                            {filterSearch ? "검색 결과가 없습니다." : "저장된 필터가 없습니다."}
                                        </p>
                                    )}
                                    {savedFilters
                                        .filter(f => f.title.toLowerCase().includes(filterSearch.toLowerCase()))
                                        .map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800/50 hover:bg-slate-800/60 hover:border-blue-500/30 transition-all group cursor-pointer" onClick={() => loadFilter(f)}>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h4 className="font-medium text-slate-200 group-hover:text-blue-400 truncate text-sm">{f.title}</h4>
                                                    <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5 opacity-60">{f.jql_query}</p>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transform -rotate-90" />
                                            </div>
                                        ))}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm" onClick={handleSave} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                            <Save className="w-4 h-4 mr-1.5" /> 저장
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSaveAs} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                            <CopyPlus className="w-4 h-4 mr-1.5" /> 다른 이름으로 저장
                        </Button>
                        <Button size="sm" onClick={handleExecute} className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30">
                            <Play className="w-4 h-4 mr-1.5" /> 수집 시작
                        </Button>
                        {collectionStatus?.status === "RUNNING" && (
                            <Button size="sm" variant="ghost" className="animate-pulse text-blue-400 hover:text-blue-300" onClick={() => setIsMonitorOpen(true)}>
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" /> 수집 중...
                            </Button>
                        )}
                    </div>
                </CardHeader>

                {/* 실시간 모니터링 다이얼로그 */}
                <Dialog open={isMonitorOpen} onOpenChange={setIsMonitorOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-blue-400" />
                                수집 프로세스 모니터링
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 pt-4">
                            {/* 상태 요약 */}
                            <div className="flex items-center justify-between px-1">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-300">현재 상태:
                                        <Badge className={cn("ml-2",
                                            collectionStatus?.status === "RUNNING" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                                                collectionStatus?.status === "DONE" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                                                    "bg-slate-800 text-slate-400"
                                        )}>
                                            {collectionStatus?.status || "IDLE"}
                                        </Badge>
                                    </p>
                                    <p className="text-[11px] text-slate-500">{collectionStatus?.status_message}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-slate-200">
                                        {collectionStatus?.status === "DONE" ? "100" :
                                            (collectionStatus?.progress_total ? Math.round((collectionStatus.progress_current / collectionStatus.progress_total) * 100) : 0)}%
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {collectionStatus?.status === "DONE" ? collectionStatus?.progress_total : collectionStatus?.progress_current} / {collectionStatus?.progress_total}
                                    </p>
                                </div>
                            </div>

                            {/* 프로그래스 바 */}
                            <Progress
                                value={collectionStatus?.status === "DONE" ? 100 :
                                    (collectionStatus?.progress_total ? (collectionStatus.progress_current / collectionStatus.progress_total) * 100 : 0)}
                                className="h-2 bg-slate-800 border-none overflow-hidden"
                            />

                            {/* 최근 로그 */}
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400 ml-1">최근 로그 내역</Label>
                                <div className="bg-black/30 border border-slate-800 rounded-xl p-3 h-48 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[10px]">
                                    {logs.length === 0 && <p className="text-slate-600 italic text-center py-10">기존 로그가 없거나 조회를 시작합니다...</p>}
                                    {logs.map((log: CollectionLog) => (
                                        <div key={log.id} className="flex gap-3 border-b border-slate-800/30 pb-1 last:border-0">
                                            <span className="text-slate-600 shrink-0">{format(new Date(log.created_at), "HH:mm:ss")}</span>
                                            <span className={cn("flex-1", log.level === "ERROR" ? "text-red-400" : "text-slate-300")}>{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsMonitorOpen(false)} className="border-slate-800 text-slate-400">
                                    닫기
                                </Button>
                                {collectionStatus?.status === "DONE" && (
                                    <Button size="sm" onClick={() => router.refresh()} className="bg-blue-600 hover:bg-blue-500">
                                        데이터 새로고침
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <CardContent className="space-y-0 pt-6">
                    <div className="space-y-4">
                        {conditions.map((condition, idx) => (
                            <div key={condition.id} className="relative space-y-4">
                                {/* 조건 카드 */}
                                <div className="group flex items-start gap-2 animate-in slide-in-from-left-2 duration-300">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 p-4 bg-slate-800/40 rounded-2xl border border-slate-800 group-hover:border-slate-700 transition-all shadow-lg">
                                        <div className="md:col-span-3">
                                            <Label className="text-[10px] text-slate-500 mb-1 block ml-1">대상 필드</Label>
                                            <Select
                                                value={condition.field}
                                                onValueChange={(val) => updateCondition(condition.id, { field: val, operator: OPERATORS[val][0].value, value: val === "worklogAuthor" ? [] : "" })}
                                            >
                                                <SelectTrigger className="bg-slate-900 border-slate-700 h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 text-xs">
                                                    {FIELD_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label className="text-[10px] text-slate-500 mb-1 block ml-1">연산자</Label>
                                            <Select
                                                value={condition.operator}
                                                onValueChange={(val) => updateCondition(condition.id, { operator: val })}
                                            >
                                                <SelectTrigger className="bg-slate-900 border-slate-700 h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 text-xs">
                                                    {OPERATORS[condition.field]?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-7">
                                            <Label className="text-[10px] text-slate-500 mb-1 block ml-1">필터 값</Label>
                                            {condition.field === "worklogAuthor" ? (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="h-9 bg-slate-900 border-slate-700 text-xs text-slate-300">
                                                                <Users className="w-3.5 h-3.5 mr-2" />
                                                                작업자 선택/필터 ({condition.value.length}명)
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-4 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Search className="w-4 h-4 text-slate-500" />
                                                                    <Input
                                                                        placeholder="이름/계정 검색..."
                                                                        className="h-8 text-xs bg-slate-800 border-slate-700"
                                                                        value={searchQuery}
                                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Select value={partFilter} onValueChange={setPartFilter}>
                                                                        <SelectTrigger className="h-8 text-[10px] bg-slate-800 border-slate-700 flex-1">
                                                                            <SelectValue placeholder="부서 선택" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-slate-800 border-slate-700">
                                                                            <SelectItem value="all">전체 부서</SelectItem>
                                                                            {Array.from(new Set(users.map(u => u.part))).map(p => (
                                                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        className="h-8 text-[10px] whitespace-nowrap"
                                                                        onClick={() => {
                                                                            const filtered = users.filter(u => partFilter === "all" || u.part === partFilter);
                                                                            const currentVals = Array.isArray(condition.value) ? condition.value : [];
                                                                            const newVals = Array.from(new Set([...currentVals, ...filtered.map(u => u.dt_account)]));
                                                                            updateCondition(condition.id, { value: newVals });
                                                                        }}
                                                                    >
                                                                        부서 일괄 추가
                                                                    </Button>
                                                                </div>
                                                                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                                                    <span className="text-[10px] text-slate-500">목록 ({users.filter(u => (partFilter === "all" || u.part === partFilter) && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.dt_account.toLowerCase().includes(searchQuery.toLowerCase()))).length}명)</span>
                                                                    <Button variant="ghost" className="h-4 text-[10px] text-red-400 p-0" onClick={() => updateCondition(condition.id, { value: [] })}>초기화</Button>
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                                                    {users
                                                                        .filter(u => (partFilter === "all" || u.part === partFilter) && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.dt_account.toLowerCase().includes(searchQuery.toLowerCase())))
                                                                        .map(user => (
                                                                            <div key={user.dt_account} className="flex items-center space-x-2 p-1 hover:bg-slate-800 rounded transition-colors group">
                                                                                <Checkbox
                                                                                    id={`user-${condition.id}-${user.dt_account}`}
                                                                                    checked={condition.value.includes(user.dt_account)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        if (checked) {
                                                                                            updateCondition(condition.id, { value: [...condition.value, user.dt_account] });
                                                                                        } else {
                                                                                            updateCondition(condition.id, { value: condition.value.filter((v: string) => v !== user.dt_account) });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <label htmlFor={`user-${condition.id}-${user.dt_account}`} className="text-xs cursor-pointer flex flex-col flex-1">
                                                                                    <span className="text-slate-200">{user.name}</span>
                                                                                    <span className="text-[10px] text-slate-500">{user.dt_account} | {user.part}</span>
                                                                                </label>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <div className="flex flex-wrap gap-1 max-w-md">
                                                        {condition.value.slice(0, 5).map((v: string) => (
                                                            <Badge key={v} variant="secondary" className="bg-slate-800 border-slate-700 text-[10px] gap-1 pr-1 py-0.5 px-2">
                                                                {v}
                                                                <XCircle className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => updateCondition(condition.id, { value: condition.value.filter((val: any) => val !== v) })} />
                                                            </Badge>
                                                        ))}
                                                        {condition.value.length > 5 && <span className="text-[10px] text-slate-500">외 {condition.value.length - 5}명</span>}
                                                    </div>
                                                </div>
                                            ) : condition.field === "worklogDate" || condition.field === "updatedDate" || condition.field === "createdDate" ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="yyyy-MM-dd"
                                                        value={typeof condition.value === 'string' ? condition.value.slice(0, 10) : ""}
                                                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                                                        className="bg-slate-900 border-slate-700 h-9 text-xs flex-1"
                                                    />
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" size="icon" className="h-9 w-9 bg-slate-900 border-slate-700 text-blue-400 hover:text-blue-300">
                                                                <CalendarIcon className="h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                                                            <Calendar
                                                                mode="single"
                                                                selected={condition.value && !isNaN(Date.parse(condition.value)) ? new Date(condition.value) : undefined}
                                                                defaultMonth={condition.value && !isNaN(Date.parse(condition.value)) ? new Date(condition.value) : new Date()}
                                                                onSelect={(date) => updateCondition(condition.id, { value: date ? format(date, "yyyy-MM-dd") : "" })}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            ) : condition.field === "custom" ? (
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        placeholder="JQL 구문을 직접 입력하세요 (예: status = 'In Progress')"
                                                        value={typeof condition.value === 'string' ? condition.value : ""}
                                                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                                                        className="bg-slate-900 border-slate-700 h-9 text-xs flex-1 font-mono text-blue-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 h-9">
                                                    <Input
                                                        placeholder="검색어 또는 값 입력 후 엔터..."
                                                        className="bg-slate-900 border-slate-700 text-slate-200 h-full text-xs"
                                                        value={Array.isArray(condition.value) ? "" : condition.value}
                                                        onChange={(e) => !Array.isArray(condition.value) && updateCondition(condition.id, { value: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && e.currentTarget.value) {
                                                                const vals = Array.isArray(condition.value) ? condition.value : (condition.value ? [condition.value] : []);
                                                                updateCondition(condition.id, { value: [...vals, e.currentTarget.value] });
                                                                e.currentTarget.value = "";
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {/* 값 뱃지 공간 */}
                                            {Array.isArray(condition.value) && condition.field !== "worklogAuthor" && condition.value.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {condition.value.map((v: string) => (
                                                        <Badge key={v} variant="secondary" className="bg-slate-800 border-slate-700 text-[10px] gap-1 pr-1 py-0 px-2 h-5">
                                                            {v}
                                                            <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-400" onClick={() => updateCondition(condition.id, { value: condition.value.filter((val: any) => val !== v) })} />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCondition(condition.id)}
                                        className="text-slate-700 hover:text-red-400 self-start mt-4"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* 연산자 결합 디자인 */}
                                {idx < conditions.length - 1 && (
                                    <div className="flex justify-center -my-2 relative z-10">
                                        <div className="bg-slate-900 border border-slate-800 rounded-full p-1 flex shadow-lg overflow-hidden">
                                            <button
                                                onClick={() => updateCondition(condition.id, { logic: "AND" })}
                                                className={cn("px-4 py-1 text-[10px] font-bold rounded-full transition-all", condition.logic === "AND" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300")}
                                            >
                                                AND
                                            </button>
                                            <button
                                                onClick={() => updateCondition(condition.id, { logic: "OR" })}
                                                className={cn("px-4 py-1 text-[10px] font-bold rounded-full transition-all", condition.logic === "OR" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300")}
                                            >
                                                OR
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            onClick={addCondition}
                            className="w-full border-dashed border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 py-4 mt-2 rounded-xl transition-all group"
                        >
                            <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            새 조건 규칙 추가
                        </Button>
                    </div>

                </CardContent>

                {/* 하단 JQL 프리뷰 영역 (강조) */}
                <div className="mt-4 p-6 bg-slate-800/20 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                            <Copy className="w-3.5 h-3.5" /> 완성된 전체 JQL 쿼리
                        </Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            onClick={() => {
                                navigator.clipboard.writeText(generatedJQL);
                                alert("JQL이 클립보드에 복사되었습니다.");
                            }}
                        >
                            클립보드 복사
                        </Button>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 break-all leading-relaxed shadow-inner min-h-[60px]">
                        {generatedJQL || "조건을 입력하면 완성된 JQL이 여기에 표시됩니다."}
                    </div>
                </div>
            </Card>

            <div className="hidden lg:block lg:col-span-3">
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-3">
                    <p className="font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">💡 빌더 이용 가이드</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>각 조건 사이에 <span className="text-blue-400 font-bold">AND/OR</span>를 지정할 수 있습니다.</li>
                        <li><span className="text-yellow-500 font-bold">필터 관리</span>에서 저장된 설정을 불러오거나 삭제하세요.</li>
                        <li>이미 가지고 있는 JQL이 있다면 <span className="text-purple-400 font-bold">JQL 임포트</span> 기능을 사용하여 빌더를 자동 구성하세요.</li>
                        <li>DT계정 입력 시 <span className="text-blue-300">자동완성</span> 목록에서 선택하거나 직접 입력 후 엔터를 눌러 추가하세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
