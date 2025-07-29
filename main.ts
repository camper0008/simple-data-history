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
        ctx.response.body = db.history(ctx.params.from, ctx.params.to);
    });

    routes.post("/api/log/:value", (ctx) => {
        activeRecords.push({
            timestamp: new Date().toISOString(),
            value: parseInt(ctx.params.value),
        });
        ctx.response.status = 200;
    });

    routes.get("/", async (ctx) => {
        await ctx.send({ root: "./web", path: "index.html" });
    });

    routes.get("/:_+", async (ctx) => {
        await ctx.send({ root: "./web" });
    });

    const app = new Application();
    app.use(routes.routes());
    app.use(routes.allowedMethods());

    app.addEventListener("listen", ({ port, hostname }) => {
        console.log(`listening on ${hostname},`, port);
    });

    setInterval(() => {
        if (previousRecords.length === 0) {
            previousRecords = activeRecords;
            activeRecords = [];
            return;
        }
        const median = Math.round(
            previousRecords.reduce((acc, curr) => acc + curr.value, 0) /
                previousRecords.length,
        );
        previousRecords = activeRecords;
        activeRecords = [];
        db.save(new Date().toISOString(), median);
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
