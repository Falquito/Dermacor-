import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Aquí puedes agregar datos de ejemplo para el seed
  console.log('🌱 Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })