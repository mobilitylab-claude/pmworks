import { FilterManagement } from "@/components/FilterManagement";
import { getFilters } from "@/lib/actions-filter";

export default async function FiltersPage() {
    const filters = await getFilters();

    return (
        <main className="container mx-auto py-10 px-4 max-w-6xl">
            <FilterManagement initialFilters={filters} />
        </main>
    );
}
