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

export type Notification = {
    id: number;
    title: string;
    message: string;
    is_read: number;
    collection_id?: number;
    created_at: string;
}

export type Schedule = {
    id?: number;
    filter_id: number;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
    target_time: string;
    target_date?: string;
    is_active?: number;
}
import { unstable_noStore as noStore } from "next/cache";

export async function getCollectionStatus(): Promise<CollectionStatus> {
    noStore();
    // 1. RPC 시도
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
        console.warn("Status RPC polling fail, falling back to local DB:", e.message);
    }

    // 2. 로컬 DB 폴백
    try {
        const db = getDb('status', true);
        try {
            const config = db.prepare("SELECT key, value, updated_at FROM active_config").all() as any[];
            const getVal = (key: string) => config.find(c => c.key === key);

            return {
                status: getVal('status')?.value || 'IDLE',
                progress_current: parseInt(getVal('progress_current')?.value || '0'),
                progress_total: parseInt(getVal('progress_total')?.value || '0'),
                status_message: getVal('status_message')?.value || '대기 중...',
                updated_at: getVal('status')?.updated_at || new Date().toISOString()
            };
        } finally {
            db.close();
        }
    } catch (dbErr) {
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
    // 1. RPC 시도
    try {
        const res = await executeRemoteCommand('get_logs', { limit });
        if (Array.isArray(res)) {
            return res.filter(l => l && typeof l === 'object').map(l => ({
                id: Number(l.id),
                message: String(l.message || ''),
                level: String(l.level || 'INFO'),
                created_at: String(l.created_at || '')
            }));
        }
    } catch (e) {
        console.warn("RPC fetch logs failed, falling back to local DB:", e);
    }

    // 2. 로컬 DB 폴백
    try {
        const db = getDb('status', true);
        try {
            const res = db.prepare("SELECT * FROM collection_logs ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
            return res.map(l => ({
                id: Number(l.id),
                message: String(l.message || ''),
                level: String(l.level || 'INFO'),
                created_at: String(l.created_at || '')
            }));
        } finally {
            db.close();
        }
    } catch (e) {
        return [];
    }
}

export async function getNotifications(): Promise<Notification[]> {
    noStore();
    // 1. RPC 시도
    try {
        const res = await executeRemoteCommand('get_notifications', {});
        if (Array.isArray(res)) {
            return res.filter(n => n && typeof n === 'object').map(n => ({
                id: Number(n.id) || 0,
                title: String(n.title || ''),
                message: String(n.message || ''),
                is_read: Number(n.is_read) || 0,
                collection_id: n.collection_id ? Number(n.collection_id) : undefined,
                created_at: String(n.created_at || new Date().toISOString())
            }));
        }
    } catch (e) {
        console.warn("RPC fetch notifications failed, falling back to local DB:", e);
    }

    // 2. 로컬 DB 폴백
    try {
        const db = getDb('status', true);
        try {
            const res = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all() as any[];
            return res.map(n => ({
                id: Number(n.id) || 0,
                title: String(n.title || ''),
                message: String(n.message || ''),
                is_read: Number(n.is_read) || 0,
                collection_id: n.collection_id ? Number(n.collection_id) : undefined,
                created_at: String(n.created_at || new Date().toISOString())
            }));
        } finally {
            db.close();
        }
    } catch (e) {
        return [];
    }
}

export async function markAsRead(id: number | 'all') {
    try {
        await executeRemoteCommand('mark_as_read', { id });
    } catch (e) {
        console.error("Failed to mark as read:", e);
    }
}

export async function getSchedules(): Promise<Schedule[]> {
    noStore();
    // 1. RPC 시도
    try {
        const res = await executeRemoteCommand('get_schedules', {});
        if (Array.isArray(res)) {
            return res.filter(s => s && typeof s === 'object').map(s => ({
                id: Number(s.id),
                filter_id: Number(s.filter_id),
                frequency: (s.frequency || 'DAILY') as any,
                target_time: String(s.target_time || '09:00'),
                target_date: s.target_date ? String(s.target_date) : undefined,
                is_active: Number(s.is_active ?? 1)
            }));
        }
    } catch (e) {
        console.warn("RPC fetch schedules failed, falling back to local DB:", e);
    }

    // 2. 로컬 DB 폴백
    try {
        const db = getDb('status', true);
        try {
            const res = db.prepare("SELECT * FROM schedules ORDER BY created_at DESC").all() as any[];
            return res.map(s => ({
                id: Number(s.id),
                filter_id: Number(s.filter_id),
                frequency: (s.frequency || 'DAILY') as any,
                target_time: String(s.target_time || '09:00'),
                target_date: s.target_date ? String(s.target_date) : undefined,
                is_active: Number(s.is_active ?? 1)
            }));
        } finally {
            db.close();
        }
    } catch (e) {
        return [];
    }
}

export async function saveSchedule(schedule: Schedule) {
    try {
        await executeRemoteCommand('save_schedule', schedule);
    } catch (e) {
        console.error("Failed to save schedule:", e);
        throw e;
    }
}

export async function deleteSchedule(id: number) {
    try {
        await executeRemoteCommand('delete_schedule', { id });
    } catch (e) {
        console.error("Failed to delete schedule:", e);
        throw e;
    }
}

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://192.168.105.10:5001/api/command";

async function executeRemoteCommand(command: string, data: any) {
    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, data }),
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const errBody = await response.json();
                if (errBody && errBody.message) errorMsg = errBody.message;
            } catch (e) { }
            throw new Error(`RPC Error: ${errorMsg}`);
        }

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
