import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Samba(Z: 드라이브) 데이터베이스 경로 분리
const BASE_PATH = 'Z:/workspace/webApps/JiraAnal_New/data';
const STATUS_DB_PATH = path.join(BASE_PATH, 'jira_status.db');
const DATA_DB_PATH = path.join(BASE_PATH, 'jira_data_v2.db');

let statusDbInstance: Database.Database | null = null;
let dataDbInstance: Database.Database | null = null;

export type DbType = 'status' | 'data';

export function getDb(type: DbType = 'data', readonly: boolean = false): Database.Database {
    // [변경] 모든 DB는 실시간성 확보를 위해 캐싱하지 않고 매번 새로 연결

    const dbPath = type === 'status' ? STATUS_DB_PATH : DATA_DB_PATH;

    let isNewDb = false;
    try {
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
            console.log(`Initializing empty database file: ${dbPath}`);
            isNewDb = true;
            if (!fs.existsSync(dbPath)) {
                fs.closeSync(fs.openSync(dbPath, 'w'));
            }
        }
    } catch (fsError) {
        console.error("FileSystem error during DB check:", fsError);
    }

    let db: Database.Database;
    try {
        // [수정] 새 DB인 경우 권한에 상관없이 초기 1회는 쓰기 가능 모드로 열어 테이블 생성장치 마련
        db = new Database(dbPath, {
            readonly: isNewDb ? false : readonly,
            timeout: 20000
        });

        // 최적화 PRAGMA (Samba 공유 시 필수)
        try {
            if (!readonly && !isNewDb) { // 원래 쓰기 모드 요청이거나, 새 DB가 아니면서 쓰기 모드일 때
                db.pragma('journal_mode = DELETE');
                db.pragma('synchronous = NORMAL');
            }
            db.pragma('mmap_size = 0');
            db.pragma('temp_store = MEMORY');
            // [수정] 캐시를 0으로 설정하여 매번 디스크에서 직접 읽도록 강제 (Samba 실시간성 확보)
            db.pragma('cache_size = 0');
            // Samba 환경에서 파일 락 경합을 줄이기 위해 locking_mode 설정
            db.pragma('locking_mode = NORMAL');
        } catch (pragmaError) {
            console.warn(`PRAGMA optimization skipped for ${type} DB:`, pragmaError);
        }

        if (readonly && !isNewDb) {
            // 모든 설정이 완료된 후 최종적으로 읽기 전용 제약 적용
            try {
                db.pragma('query_only = ON');
            } catch { }
        }

        // 무결성 및 인프라 체크
        if (isNewDb) {
            console.log(`Provisioning schema for ${type} DB...`);
            initSchema(db, type);

            // 만약 읽기 전용을 원했는데 쓰기로 열었다면, 닫고 다시 읽기 전용으로 교체
            if (readonly) {
                db.close();
                db = new Database(dbPath, { readonly: true, timeout: 20000 });
                db.pragma('query_only = ON');
            }
        }

        // 무결성 검사
        try {
            db.prepare("SELECT count(*) FROM sqlite_master").get();
        } catch (e: any) {
            if (e.message.includes("malformed")) {
                // 손상 시 자동 복구 시도 (데이터 전용)
                if (type === 'data') {
                    const backupPath = dbPath + ".bak";
                    if (fs.existsSync(backupPath)) {
                        db.close();
                        fs.renameSync(dbPath, dbPath + ".corrupt_" + Date.now());
                        fs.copyFileSync(backupPath, dbPath);
                        db = new Database(dbPath, { readonly: readonly, timeout: 20000 });
                        console.log("Auto-recovered data DB from backup.");
                    }
                }
                if (e.message.includes("malformed")) throw new Error(`DB_MALFORMED_${type}`);
            }
            throw e;
        }

    } catch (error: any) {
        if (error.message?.includes("DB_MALFORMED")) {
            throw new Error(`${type} 데이터베이스 파일이 손상되었습니다. (Samba I/O 경합)`);
        }
        throw error;
    }

    // [변경] 데이터 DB 캐싱 제거하여 Samba 최신성 보장
    return db;
}

function initSchema(db: Database.Database, type: DbType) {
    if (type === 'status') {
        db.exec(`
            CREATE TABLE IF NOT EXISTS filters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                jql_query TEXT NOT NULL,
                config_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS active_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS collection_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                level TEXT DEFAULT 'INFO',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filter_title TEXT,
                jql_query TEXT,
                collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT,
                issue_count INTEGER DEFAULT 0,
                worklog_count INTEGER DEFAULT 0
            );
            INSERT OR IGNORE INTO active_config (key, value) VALUES ('status', 'IDLE');
            INSERT OR IGNORE INTO active_config (key, value) VALUES ('progress_current', '0');
            INSERT OR IGNORE INTO active_config (key, value) VALUES ('progress_total', '0');
            INSERT OR IGNORE INTO active_config (key, value) VALUES ('status_message', '대기 중...');
        `);
    } else {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                dt_account TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                part TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS issues (
                key TEXT, summary TEXT, project_key TEXT, collection_id INTEGER,
                PRIMARY KEY (key, collection_id)
            );
            CREATE TABLE IF NOT EXISTS worklogs (
                id TEXT, issue_key TEXT, author TEXT, time_spent_seconds INTEGER,
                comment TEXT, started_at TEXT, created_at TEXT, collection_id INTEGER,
                PRIMARY KEY (id, collection_id)
            );
        `);
    }
}

// 기존 query 함수들 업데이트 필요
export function getDetailedWorklogs(collectionId?: number) {
    const db = getDb('data', true); // 읽기 전용
    let targetId = collectionId;
    if (!targetId) {
        // collections는 status db에 있으므로 크로스 쿼리가 필요한데, 
        // 간단하게 status db에서 id를 먼저 조회한 후 data db 쿼리에 넣음
        const statusDb = getDb('status', true);
        const lastCollection = statusDb.prepare("SELECT id FROM collections WHERE status = 'DONE' ORDER BY id DESC LIMIT 1").get() as { id: number } | undefined;
        if (!lastCollection) return [];
        targetId = lastCollection.id;
    }

    try {
        return db.prepare(`
            SELECT w.*, i.summary as issue_summary
            FROM worklogs w
            LEFT JOIN issues i ON w.issue_key = i.key AND w.collection_id = i.collection_id
            WHERE w.collection_id = ?
            ORDER BY w.started_at DESC, w.created_at DESC
            LIMIT 5000
        `).all(targetId) as any[];
    } finally {
        db.close();
    }
}

export function getCollections(startDate?: string, endDate?: string) {
    const db = getDb('status', true);
    try {
        let query = "SELECT * FROM collections WHERE status = 'DONE'";
        const params: any[] = [];

        if (startDate) {
            query += " AND collected_at >= ?";
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            query += " AND collected_at <= ?";
            params.push(`${endDate} 23:59:59`);
        }

        query += " ORDER BY collected_at DESC";
        return db.prepare(query).all(...params) as any[];
    } finally {
        db.close();
    }
}

export function getStats(collectionId?: number) {
    const statusDb = getDb('status', true);
    let targetId = collectionId;
    if (!targetId) {
        const lastCollection = statusDb.prepare("SELECT id FROM collections WHERE status = 'DONE' ORDER BY id DESC LIMIT 1").get() as { id: number } | undefined;
        if (!lastCollection) return null;
        targetId = lastCollection.id;
    }

    const dataDb = getDb('data', true);
    try {
        const HOURS_PER_MAN_MONTH = 20.5 * 8; // 1 MM = 164.0 hours

        // 2. 투입 시간 총합
        const totalHoursRes = dataDb.prepare("SELECT SUM(time_spent_seconds) as total FROM worklogs WHERE collection_id = ?").get(targetId) as { total: number };
        const totalHours = Math.round((totalHoursRes.total || 0) / 3600);
        const totalMM = parseFloat(((totalHoursRes.total || 0) / 3600 / HOURS_PER_MAN_MONTH).toFixed(2));

        // 3. 참여 인원 수
        const authorCountRes = dataDb.prepare("SELECT COUNT(DISTINCT author) as count FROM worklogs WHERE collection_id = ?").get(targetId) as { count: number };

        // 4. 관련 이슈 수
        const issueCountRes = dataDb.prepare("SELECT COUNT(DISTINCT issue_key) as count FROM worklogs WHERE collection_id = ?").get(targetId) as { count: number };

        // 5. 마지막 업데이트
        const lastUpdateRes = statusDb.prepare("SELECT updated_at FROM active_config WHERE key = 'status'").get() as { updated_at: string };

        // 6. 작업자별 비중 (이름 (ID) 형식 적용)
        const authorStats = dataDb.prepare(`
            SELECT 
                w.author as author_id,
                COALESCE(u.name, w.author) || ' (' || w.author || ')' as author_display,
                ROUND(SUM(w.time_spent_seconds) / 3600.0, 1) as hours,
                ROUND(SUM(w.time_spent_seconds) / 3600.0 / ?, 2) as mm
            FROM worklogs w
            LEFT JOIN users u ON LOWER(w.author) = LOWER(u.dt_account)
            WHERE w.collection_id = ?
            GROUP BY w.author
            ORDER BY hours DESC
        `).all(HOURS_PER_MAN_MONTH, targetId) as any[];

        // 7. 월별 비중 (일별에서 월별로 전환)
        const monthlyStats = dataDb.prepare(`
            SELECT SUBSTR(started_at, 1, 7) as month, 
                   ROUND(SUM(time_spent_seconds) / 3600.0, 1) as hours,
                   ROUND(SUM(time_spent_seconds) / 3600.0 / ?, 2) as mm
            FROM worklogs
            WHERE collection_id = ?
            GROUP BY month
            ORDER BY month ASC
        `).all(HOURS_PER_MAN_MONTH, targetId) as any[];

        return {
            overview: {
                totalHours,
                totalMM,
                authorCount: authorCountRes.count,
                issueCount: issueCountRes.count,
                lastUpdate: lastUpdateRes?.updated_at || '-'
            },
            authorStats,
            monthlyStats
        };
    } finally {
        dataDb.close();
        statusDb.close();
    }
}
