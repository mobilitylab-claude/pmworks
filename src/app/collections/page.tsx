import { getCollections } from "@/lib/db";
import HistoryList from "@/components/HistoryList";
import { Suspense } from "react";

export default async function CollectionsPage({
    searchParams
}: {
    searchParams: { startDate?: string; endDate?: string }
}) {
    // searchParams는 Promise가 아니므로 직접 접근 가능 (Next.js 13/14 Pages Router 기준, App Router에서는 동적 접근 필요할 수 있으나 이 경우 직접 사용 가능)
    const startDate = searchParams.startDate || "";
    const endDate = searchParams.endDate || "";

    const initialCollections = await getCollections(startDate, endDate);

    return (
        <main className="container mx-auto py-10 px-4">
            <Suspense fallback={<div className="text-slate-500">로딩 중...</div>}>
                <HistoryList initialCollections={initialCollections} />
            </Suspense>
        </main>
    );
}
