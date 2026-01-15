"use server"

import { getDb } from "./db";
import { revalidatePath } from "next/cache";

export type User = {
    dt_account: string;
    name: string;
    email: string;
    part: string;
    created_at?: string;
}

const RPC_URL = "http://192.168.105.10:5001/api/command";

async function executeRemoteCommand(command: string, data: any) {
    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, data }),
            next: { revalidate: 0 }
        });
        if (!response.ok) throw new Error(`RPC Error: ${response.statusText}`);
        return await response.json();
    } catch (e: any) {
        console.error(`Failed to execute remote command [${command}]:`, e.message);
        throw new Error(`리눅스 명령 서버 통신 실패: ${e.message}. 리눅스 PC에서 server.py가 실행 중인지 확인해 주세요.`);
    }
}

export async function getUsers(): Promise<User[]> {
    const db = getDb('data', true);
    return db.prepare("SELECT * FROM users ORDER BY name ASC").all() as User[];
}

export async function addUser(user: User) {
    await executeRemoteCommand('save_user', user);
    revalidatePath("/settings/users");
}

export async function importUsers(users: User[]) {
    await executeRemoteCommand('import_users', users);
    revalidatePath("/settings/users");
}

export async function deleteUser(dt_account: string) {
    await executeRemoteCommand('delete_user', { dt_account });
    revalidatePath("/settings/users");
}

export async function deleteMultipleUsers(ids: string[]) {
    // 하나씩 삭제하거나 리눅스 서버에 벌크 삭제 명령을 추가할 수 있음
    // 여기서는 간단하게 반복 호출 (명령 서버 부하 적음)
    for (const id of ids) {
        await executeRemoteCommand('delete_user', { dt_account: id });
    }
    revalidatePath("/settings/users");
}

export async function deleteAllUsers() {
    await executeRemoteCommand('delete_all_users', {});
    revalidatePath("/settings/users");
}
