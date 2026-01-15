"use client"

import { useState } from "react";
import { User, addUser, deleteUser, deleteMultipleUsers, deleteAllUsers, importUsers } from "@/lib/actions-user";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Edit, UserPlus, Users, Upload, FileSpreadsheet, CheckSquare, Square, Filter } from "lucide-react";
import * as XLSX from "xlsx";

const userSchema = z.object({
    dt_account: z.string().min(1, "DT계정은 필수입니다."),
    name: z.string().min(1, "성명은 필수입니다."),
    email: z.string().email("올바른 이메일 형식이 아닙니다.").or(z.literal("")),
    part: z.string().min(1, "부서는 필수입니다."),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserManagementProps {
    initialUsers: User[];
}

export function UserManagement({ initialUsers }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedPart, setSelectedPart] = useState<string>("all");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            dt_account: "",
            name: "",
            email: "",
            part: "",
        },
    });

    // 고유 부서 목록 추출
    const parts = Array.from(new Set(users.map(u => u.part))).filter(Boolean).sort();

    // 필터링된 사용자 목록
    const filteredUsers = selectedPart === "all"
        ? users
        : users.filter(u => u.part === selectedPart);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            // 데이터 변환 (헤더 매핑: DT계정, 성명, 이메일, 부서)
            const importedUsers: User[] = data.map(row => ({
                dt_account: String(row["DT계정"] || row["dt_account"] || row["ID"] || ""),
                name: String(row["성명"] || row["name"] || row["이름"] || ""),
                email: String(row["이메일"] || row["email"] || ""),
                part: String(row["부서/파트"] || row["부서"] || row["파트"] || row["part"] || row["소속"] || ""),
            })).filter(u => u.dt_account && u.name);

            if (importedUsers.length === 0) {
                alert("가져올 유효한 사용자 데이터가 없습니다. (헤더 확인 필요)");
                return;
            }

            if (confirm(`${importedUsers.length}명의 사용자를 임포트하시겠습니까? (기존 데이터와 중복 시 업데이트됨)`)) {
                // const { importUsers, deleteAllUsers } = await import("@/lib/actions-user"); // Moved to top-level import
                // if (confirm("임포트 전 기존 사용자 데이터를 모두 삭제하시겠습니까?")) {
                //     await deleteAllUsers();
                // }
                await importUsers(importedUsers);
                alert("사용자 정보를 성공적으로 가져왔습니다.");
                window.location.reload();
            }
        };
        reader.readAsBinaryString(file);
    };

    async function onSubmit(values: UserFormValues) {
        await addUser(values);
        // 간단한 상태 업데이트 (실제로는 서버 액션 후 revalidatePath가 작동하지만 클라이언트에서도 즉시 반영)
        if (editingUser) {
            setUsers(users.map(u => u.dt_account === values.dt_account ? values : u));
        } else {
            setUsers([...users, values]);
        }
        setIsAddOpen(false);
        setEditingUser(null);
        form.reset();
    }

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.reset(user);
        setIsAddOpen(true);
    };

    const handleDelete = async (dt_account: string) => {
        if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
            await deleteUser(dt_account);
            setUsers(users.filter(u => u.dt_account !== dt_account));
            setSelectedIds(selectedIds.filter(id => id !== dt_account));
        }
    };

    const handleToggleAll = () => {
        if (selectedIds.length === filteredUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredUsers.map(u => u.dt_account));
        }
    };

    const handleToggleOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`선택한 ${selectedIds.length}명의 사용자를 삭제하시겠습니까?`)) {
            await deleteMultipleUsers(selectedIds);
            setUsers(users.filter(u => !selectedIds.includes(u.dt_account)));
            setSelectedIds([]);
        }
    };

    const handleDeleteAll = async () => {
        if (confirm("모든 사용자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            await deleteAllUsers();
            setUsers([]);
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-slate-100 font-sans">사용자 DB 관리</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* 부서 필터 추가 */}
                    <div className="flex items-center gap-2 mr-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <Select value={selectedPart} onValueChange={setSelectedPart}>
                            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800 text-slate-300">
                                <SelectValue placeholder="부서 필터" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                                <SelectItem value="all">전체 부서</SelectItem>
                                {parts.map(part => (
                                    <SelectItem key={part} value={part}>{part}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleImport}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
                            엑셀 임포트
                        </Button>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open);
                        if (!open) {
                            setEditingUser(null);
                            form.reset({ dt_account: "", name: "", email: "", part: "" });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                                <UserPlus className="w-4 h-4 mr-2" />
                                사용자 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingUser ? "사용자 수정" : "새 사용자 등록"}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="dt_account"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>DT계정ID (Unique)</FormLabel>
                                                <FormControl>
                                                    <Input disabled={!!editingUser} placeholder="예: user123" {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>성명</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="홍길동" {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>이메일</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="user@example.com" {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="part"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>부서/파트</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="모빌리티개발팀" {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                                            {editingUser ? "수정 완료" : "등록 완료"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 벌크 액션 툴바 */}
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-lg backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                        onCheckedChange={handleToggleAll}
                        id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-slate-400 cursor-pointer">
                        전체 선택 ({selectedIds.length}/{filteredUsers.length})
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={selectedIds.length === 0}
                        onClick={handleDeleteSelected}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:opacity-30 transition-all font-sans"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        선택 삭제
                    </Button>
                    <div className="w-px h-4 bg-slate-800 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={filteredUsers.length === 0}
                        onClick={handleDeleteAll}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 transition-all font-sans"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        전체 초기화
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-slate-800/50">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="text-slate-400 font-sans">부서/파트</TableHead>
                            <TableHead className="text-slate-400 font-sans">성명</TableHead>
                            <TableHead className="text-slate-400 font-sans">DT계정</TableHead>
                            <TableHead className="text-slate-400 font-sans">이메일</TableHead>
                            <TableHead className="text-center text-slate-400 font-sans">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-slate-500 font-sans">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    {selectedPart !== "all" ? `${selectedPart}에 해당하는 사용자가 없습니다.` : "등록된 사용자가 없습니다."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.dt_account}
                                    className={`border-slate-800 hover:bg-slate-800/30 transition-colors ${selectedIds.includes(user.dt_account) ? 'bg-blue-900/10' : ''}`}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(user.dt_account)}
                                            onCheckedChange={() => handleToggleOne(user.dt_account)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-200">{user.part}</TableCell>
                                    <TableCell className="text-slate-200">{user.name}</TableCell>
                                    <TableCell>
                                        <code className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 font-mono">
                                            {user.dt_account}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-slate-400 font-sans">{user.email || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(user)}
                                                className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.dt_account)}
                                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
