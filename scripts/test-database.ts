import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
    const created = await prisma.ping.create({
        data: { message: "hello from workorder-generator" },
    });
    console.log("Created:", created);

    const all = await prisma.ping.findMany();
    console.log(`Total rows: ${all.length}`);
}

main()
    .catch((e) => {
        console.error("Failed", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
