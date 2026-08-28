import "dotenv/config";
import { defineConfig } from "prisma/config";

console.log(
  "DATABASE env keys present:",
  Object.keys(process.env).filter((k) => k.startsWith("DATABASE"))
)
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL_UNPOOLED ?? "",
    },
});
