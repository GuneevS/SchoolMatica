
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // AppUser is the model for users in SchoolMatica
    const teacher = await prisma.appUser.findFirst({
        where: { email: "naledi.dlamini@schoolmatica.com" },
        include: {
            roleAssignments: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!teacher) {
        console.log("Teacher not found");
        return;
    }

    console.log(`Teacher: ${teacher.name} (${teacher.email})`);
    console.log("Teacher Role Assignments:");
    teacher.roleAssignments.forEach(ra => {
        console.log(`- Role: ${ra.role.name} (${ra.role.key})`);
        console.log("  Permissions:");
        ra.role.permissions.forEach(p => {
            console.log(`    - ${p.permission.key}`);
        });
    });
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
