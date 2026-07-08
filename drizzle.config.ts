import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./server/db/schema.ts",
  out: "./server/db",
  dbCredentials: {
    url: "mysql://qxixdrgo_openelections_user:ftDV8xBzDbtBGLGPApyR@web-directadmin-1.us-mci.defaultsharedweb.com/qxixdrgo_openelections"
  }
});
