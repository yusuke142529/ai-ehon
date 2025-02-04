import { prisma } from '../src/lib/prismadb'

async function main() {
    await prisma.tag.createMany({
        data: [
            { name: "動物" },
            { name: "宇宙" },
            { name: "ファンタジー" }
        ],
        skipDuplicates: true
    })
}

main().catch(e => {
    console.error(e)
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect()
})