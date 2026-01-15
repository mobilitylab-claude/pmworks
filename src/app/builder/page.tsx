import { Suspense } from "react";
import { JQLBuilder } from "@/components/JQLBuilder";
import { getUsers } from "@/lib/actions-user";
import { getFilters } from "@/lib/actions-filter";

export default async function BuilderPage() {
    const users = await getUsers();
    const filters = await getFilters();

    return (
        <main className="container mx-auto py-10 px-4 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                    <span className="bg-blue-600 p-2 rounded-lg">JQL</span>
                    JQL Filter Builder
                </h1>
                <p className="text-slate-400">
                    Jira 워크로그 수집을 위한 맞춤형 필터를 구성하고 실행합니다.
                </p>
            </div>

            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500">필터 빌더 로딩 중...</div>}>
                    <JQLBuilder users={users} savedFilters={filters} />
                </Suspense>
            </section>
        </main>
    );
}
