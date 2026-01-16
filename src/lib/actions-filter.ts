"use server"

import { getDb } from "./db";
import { revalidatePath } from "next/cache";

export type FilterConfig = {
    conditions: Condition[];
}

export type Condition = {
    id: string;
    field: string;
    operator: string;
    value: any;
    logic?: "AND" | "OR";
}

export type Filter = {
    id?: number;
    title: string;
    jql_query: string;
    config_json: string;
    created_at?: string;
}

const RPC_URL = "http://192.168.105.10:5001/api/command";

async function executeRemoteCommand(command: string, data: any) {
    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, data }),
            // 서버 액션이므로 타임아웃 넉넉히 설정
            next: { revalidate: 0 }
        });
        if (!response.ok) throw new Error(`RPC Error: ${response.statusText}`);
        return await response.json();
    } catch (e: any) {
        console.error(`Failed to execute remote command [${command}]:`, e.message);
        throw new Error(`리눅스 명령 서버 통신 실패: ${e.message}. 리눅스 PC에서 server.py가 실행 중인지 확인해 주세요.`);
    }
}

export async function getFilters(): Promise<Filter[]> {
    const db = getDb('status', true);
    return db.prepare("SELECT * FROM filters ORDER BY created_at DESC").all() as Filter[];
}

export async function saveFilter(filter: Filter) {
    await executeRemoteCommand('save_filter', filter);
    revalidatePath("/builder");
    revalidatePath("/filters");
}

export async function deleteFilter(id: number) {
    await executeRemoteCommand('delete_filter', { id });
    revalidatePath("/builder");
    revalidatePath("/filters");
}

export async function triggerCollection(jql: string, filterTitle: string = "이름 없는 필터", config?: any) {
    await executeRemoteCommand('trigger_collection', { jql, filter_title: filterTitle, config });
    revalidatePath("/builder");
    revalidatePath("/filters");
}
