import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Db, Record, SqliteDb } from "./db.ts";

export type Config = {
    port: number;
    hostname: string;
};

async function configFromFile(path: string): Promise<Config | null> {
    try {
        return JSON.parse(await Deno.readTextFile(path));
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        return null;
    }
}

async function listen({ port, hostname }: Config) {
    let previousRecords: Record[] = [];
    let activeRecords: Record[] = [];

    const db: Db = new SqliteDb();
    const routes = new Router();

    routes.get("/api/live", (ctx) => {
        ctx.response.body = previousRecords.concat(activeRecords);
    });

    routes.get("/api/history/:from/:to", (ctx) => {
        const from = new Date(ctx.params.from);
        const to = new Date(ctx.params.to);
        ctx.response.body = db.history(from, to);
    });

    routes.get("/api/history_csv/:from/:to", (ctx) => {
        const from = new Date(ctx.params.from);
        const to = new Date(ctx.params.to);
        const history = db.history(from, to);
        const header = `type,timestamp,value\n`;
        const doc = header +
            history.map((x) => `${x.type},${x.timestamp},${x.value}`)
                .join("\n");
        ctx.response.headers.set("Content-Type", "text/csv");
        ctx.response.body = doc;
    });

    routes.post("/api/log/:value/:type", (ctx) => {
        activeRecords.push({
            timestamp: new Date().toISOString(),
            value: parseInt(ctx.params.value),
            type: parseInt(ctx.params.type),
        });
        ctx.response.status = 200;
    });

    const app = new Application();
    app.use(routes.routes());
    app.use(routes.allowedMethods());
    app.use(async (ctx) => {
        let path = ctx.request.url.pathname;
        if (!path.includes(".") && !path.endsWith("/")) {
            ctx.response.redirect(ctx.request.url.pathname + "/");
            return;
        }
        if (path.endsWith("/")) {
            path += "index.html";
        }
        await ctx.send({ root: "./web", path });
    });

    app.addEventListener("listen", ({ port, hostname }) => {
        console.log(`listening on ${hostname},`, port);
    });

    setInterval(() => {
        if (previousRecords.length === 0) {
            previousRecords = activeRecords;
            activeRecords = [];
            return;
        }
        const typeMin = previousRecords
            .reduce((acc, { type }) => Math.min(acc, type), Infinity);
        const typeMax = previousRecords
            .reduce((acc, { type }) => Math.max(acc, type), -Infinity);
        for (let i = typeMin; i <= typeMax; ++i) {
            const fRecords = previousRecords.filter((x) => x.type === i);
            const median = Math.round(
                fRecords.reduce((acc, curr) => acc + curr.value, 0) /
                    fRecords.length,
            );
            db.save(new Date().toISOString(), median, i);
        }
        previousRecords = activeRecords;
        activeRecords = [];
    }, 1.25 * 60 * 1000);

    await app.listen({ port, hostname });
}

if (import.meta.main) {
    const configPath = "conf.json";
    const config = await configFromFile(configPath);
    if (!config) {
        console.error(`error: could not find config at '${configPath}'`);
        Deno.exit(1);
    }
    await listen(config);
}
