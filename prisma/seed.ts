import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── تعریف دسترسی‌های اتمیک ──
const PERMISSIONS = [
    { key: 'reports.view',    description: 'مشاهده لیست گزارش‌ها' },
    { key: 'reports.resolve', description: 'رسیدگی/بستن گزارش‌ها' },
    { key: 'pins.delete',     description: 'حذف هر پین (مودریشن)' },
    { key: 'users.view',      description: 'مشاهده لیست کاربران' },
    { key: 'users.ban',       description: 'مسدود/آزادسازی کاربر' },
    { key: 'users.edit',      description: 'ویرایش اطلاعات کاربران' },  
    { key: 'users.delete',    description: 'حذف کامل کاربر' },       
    { key: 'stats.view',      description: 'مشاهده آمار کلی' },
] as const

// ── تعریف نقش‌ها و دسترسی‌های هر کدام ──
const ROLES = [
    {
        name: 'admin',
        description: 'دسترسی کامل به پنل مدیریت',
        permissions: ['*'],   // همه‌ی دسترسی‌ها
    },
    {
        name: 'moderator',
        description: 'مدیر محتوا — فقط مودریشن، بدون مدیریت کاربران',
        permissions: ['reports.view', 'reports.resolve', 'pins.delete'],
    },
    {
        name: 'user',
        description: 'کاربر عادی — بدون دسترسی مدیریتی',
        permissions: [],
    },
]

async function main() {
    console.log('🌱 Seeding RBAC system...')

    // ── ۱. ساخت Permission ها (idempotent — با upsert) ──
    const permissionMap = new Map<string, string>()

    for (const perm of PERMISSIONS) {
        const record = await prisma.permission.upsert({
            where: { key: perm.key },
            update: { description: perm.description },
            create: { key: perm.key, description: perm.description },
        })
        permissionMap.set(perm.key, record.id)
        console.log(`  ✅ permission: ${perm.key}`)
    }

    // ── ۲. ساخت Role ها + وصل کردن دسترسی‌ها ──
    for (const role of ROLES) {
        const roleRecord = await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: { name: role.name, description: role.description },
        })

        // پاک کردن اتصال‌های قبلی و ساختن جدیدها (sync کامل)
        await prisma.rolePermission.deleteMany({
            where: { roleId: roleRecord.id },
        })

        const keys = role.permissions[0] === '*'
            ? PERMISSIONS.map((p) => p.key)
            : role.permissions

        for (const key of keys) {
            const permissionId = permissionMap.get(key)
            if (permissionId) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: roleRecord.id,
                        permissionId,
                    },
                })
            }
        }

        console.log(`  ✅ role: ${role.name} (${keys.length} permissions)`)
    }

    // ── ۳. اطمینان: نقش "user" به همه‌ی کاربران بی‌نقش وصل باشد ──
    const userRole = await prisma.role.findUnique({
        where: { name: 'user' },
        select: { id: true },
    })

    if (userRole) {
        // کاربرانی که هیچ نقشی ندارند → به نقش user وصل شوند
        const orphans = await prisma.user.findMany({
            where: { roles: { none: {} } },
            select: { id: true },
        })

        for (const orphan of orphans) {
            await prisma.userRole.create({
                data: { userId: orphan.id, roleId: userRole.id },
            })
        }

        if (orphans.length > 0) {
            console.log(`  ✅ ${orphans.length} کاربر بدون نقش → به نقش "user" وصل شد`)
        }
    }

    console.log('🌱 Seeding complete!')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())