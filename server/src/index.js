import "dotenv/config";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 4000;
const app = createApp(openDb());
