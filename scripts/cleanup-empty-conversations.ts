import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 🔍 پیدا کن conversationهایی که هیچ پیامی ندارن
  const emptyConversations = await prisma.conversation.findMany({
    where: {
      messages: {
        none: {},
      },
    },
    select: { id: true },
  })

  console.log(`🔍 Found ${emptyConversations.length} empty conversations`)

  if (emptyConversations.length === 0) {
    console.log('✅ Nothing to clean up!')
    return
  }

  // 🗑 اول participants رو پاک کن
  await prisma.conversationParticipant.deleteMany({
    where: {
      conversationId: { in: emptyConversations.map((c) => c.id) },
    },
  })

  // 🗑 بعد خود conversation رو
  await prisma.conversation.deleteMany({
    where: {
      id: { in: emptyConversations.map((c) => c.id) },
    },
  })

  console.log(`✅ Deleted ${emptyConversations.length} empty conversations`)
}

main().finally(() => prisma.$disconnect())