import { Database } from "jsr:@db/sqlite@0.11";

export type Record = {
    timestamp: string;
    value: number;
    type: number;
};

export interface Db {
    save(timestamp: string, value: number, type: number): void;
    history(from: Date, to: Date): Record[];
}

export class SqliteDb implements Db {
    private conn: Database;

    constructor() {
        this.conn = new Database("data.db");
        this.conn.run(
            `CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                value INTEGER NOT NULL 
                type INTEGER NOT NULL 
            )`,
        );
    }
    save(timestamp: string, value: number, type: number): void {
        this.conn.exec(
            "INSERT INTO records (timestamp, value, type) VALUES (?, ?, ?)",
            timestamp,
            value,
            type,
        );
    }
    history(from: Date, to: Date): Record[] {
        const fromUnixSec = Math.floor(from.getTime() / 1000);
        const toUnixSec = Math.floor(to.getTime() / 1000);
        const stmt = this.conn.prepare(
            `SELECT timestamp, value, type FROM records
             WHERE unixepoch(timestamp) >= ? AND unixepoch(timestamp) <= ?
             ORDER BY unixepoch(timestamp)`,
        );
        return stmt.all(fromUnixSec, toUnixSec);
    }
}
