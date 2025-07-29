import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Db, SqliteDb } from "./db.ts";

function promptPort() {
    const port = prompt("Port:", "8080")?.trim();
    if (!port) {
        throw new Error("stdin not reachable");
    }
    return parseInt(port);
}

async function main() {
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

    const port = promptPort();
    await app.listen({ port });
}

main();
