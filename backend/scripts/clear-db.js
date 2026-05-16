const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  
  // Deleting in reverse order of dependencies
  const tasks = await prisma.task.deleteMany({});
  console.log(`Deleted ${tasks.count} tasks.`);
  
  const projects = await prisma.project.deleteMany({});
  console.log(`Deleted ${projects.count} projects.`);
  
  const users = await prisma.user.deleteMany({});
  console.log(`Deleted ${users.count} users.`);
  
  console.log('Database cleared successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
