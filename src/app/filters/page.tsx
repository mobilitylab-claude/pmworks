import { FilterManagement } from "@/components/FilterManagement";
import { getFilters, Filter } from "@/lib/actions-filter";

export default async function FiltersPage() {
    let filters: Filter[] = [];
    try {
        const data = await getFilters();
        filters = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Failed to fetch filters for page:", e);
    }

    return (
        <main className="container mx-auto py-10 px-4 max-w-6xl">
            <FilterManagement initialFilters={filters} />
        </main>
    );
}
