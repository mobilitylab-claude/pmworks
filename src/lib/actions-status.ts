"use server"

import { getDb } from "./db";

export type CollectionStatus = {
    status: string;
    progress_current: number;
    progress_total: number;
    status_message: string;
    updated_at: string;
}

export type CollectionLog = {
    id: number;
    message: string;
    level: string;
    created_at: string;
}
import { unstable_noStore as noStore } from "next/cache";

export async function getCollectionStatus(): Promise<CollectionStatus> {
    noStore();
    try {
        const result = await executeRemoteCommand('get_status', {});
        return {
            status: result.status || 'IDLE',
            progress_current: parseInt(result.progress_current) || 0,
            progress_total: parseInt(result.progress_total) || 0,
            status_message: result.status_message || '대기 중...',
            updated_at: result.updated_at || new Date().toISOString()
        };
    } catch (e: any) {
        console.warn("Status RPC polling fail:", e.message);
        return {
            status: 'IDLE',
            progress_current: 0,
            progress_total: 0,
            status_message: '상태 조회 중...',
            updated_at: new Date().toISOString()
        };
    }
}

export async function getCollectionLogs(limit: number = 10): Promise<CollectionLog[]> {
    noStore();
    try {
        return await executeRemoteCommand('get_logs', { limit });
    } catch (e) {
        return [];
    }
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

export async function clearCollectionLogs() {
    await executeRemoteCommand('clear_logs', {});
}

import { getCollections } from "./db";

export async function deleteCollections(ids: number[]) {
    if (ids.length === 0) return;
    await executeRemoteCommand('delete_collections', { ids });
}

export async function getHistoryActions(startDate?: string, endDate?: string) {
    noStore();
    return getCollections(startDate, endDate);
}
