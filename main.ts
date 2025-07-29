import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Db, SqliteDb } from "./db.ts";

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
    const db: Db = new SqliteDb();
    const routes = new Router();
    routes.get("/", async (ctx) => {
        let path = ctx.request.url.pathname;
        if (path.endsWith("/")) {
            path += "index.html";
        }

        await ctx.send({ root: "./web", path });
    });

    routes.get("/history/:from/:to", (ctx) => {
        ctx.response.body = db.history(ctx.params.from, ctx.params.to);
    });

    routes.post("/upload/:value", (ctx) => {
        const timestamp = new Date().toISOString();
        const value = parseInt(ctx.params.value);
        db.save(
            timestamp,
            value,
        );
        ctx.response.status = 200;
    });

    const app = new Application();
    app.use(routes.routes());
    app.use(routes.allowedMethods());

    app.addEventListener("listen", ({ port, hostname }) => {
        console.log(`listening on ${hostname},`, port);
    });

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
