import { UserManagement } from "@/components/UserManagement";
import { getUsers } from "@/lib/actions-user";

export default async function UsersPage() {
    const initialUsers = await getUsers();

    return (
        <main className="container mx-auto py-10 px-4">
            <UserManagement initialUsers={initialUsers} />
        </main>
    );
}
