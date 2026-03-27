import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default user
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "我的成长记录" },
  });

  // Default habits
  const habits = [
    { name: "早起", icon: "🌅", color: "#f59e0b", category: "health", description: "每天 7 点前起床" },
    { name: "喝水", icon: "💧", color: "#06b6d4", category: "health", description: "每天喝够 2000ml 水" },
    { name: "运动", icon: "🏃", color: "#10b981", category: "health", description: "每天运动 30 分钟" },
    { name: "阅读", icon: "📚", color: "#8b5cf6", category: "learning", description: "每天阅读 20 分钟" },
    { name: "冥想", icon: "🧘", color: "#6366f1", category: "mindfulness", description: "每天冥想 10 分钟" },
  ];

  for (const habit of habits) {
    const existing = await prisma.habit.findFirst({ where: { name: habit.name } });
    if (!existing) {
      await prisma.habit.create({ data: habit });
    }
  }

  // Default reminders
  const reminders = [
    {
      title: "喝水提醒",
      message: "该喝水了！保持每天 2000ml 的饮水目标 💧",
      type: "water",
      schedule: JSON.stringify({ type: "interval", intervalMinutes: 90, activeHours: [8, 22] }),
      isActive: true,
    },
    {
      title: "尿酸管理",
      message: "今日饮水目标：2000ml，多喝水有助于降低尿酸！",
      type: "uric_acid",
      schedule: JSON.stringify({ type: "daily", time: "08:30" }),
      isActive: true,
    },
    {
      title: "学习提醒",
      message: "今日是否完成了学习计划？坚持学习，每天进步一点点 📚",
      type: "study",
      schedule: JSON.stringify({ type: "daily", time: "20:00" }),
      isActive: true,
    },
  ];

  for (const reminder of reminders) {
    const existing = await prisma.reminder.findFirst({ where: { title: reminder.title } });
    if (!existing) {
      await prisma.reminder.create({ data: reminder });
    }
  }

  // Default achievements
  const achievements = [
    { code: "first_checkin", title: "首次打卡", description: "完成第一次习惯打卡", icon: "🎯" },
    { code: "streak_7", title: "坚持一周", description: "连续打卡 7 天", icon: "🔥" },
    { code: "streak_30", title: "坚持一月", description: "连续打卡 30 天", icon: "🏆" },
    { code: "study_100h", title: "学习达人", description: "累计学习 100 小时", icon: "📚" },
    { code: "goals_10", title: "目标达成者", description: "完成 10 个目标", icon: "🎯" },
    { code: "journal_30", title: "日记达人", description: "写满 30 篇日记", icon: "📝" },
    { code: "pomodoro_100", title: "番茄专家", description: "完成 100 个番茄钟", icon: "🍅" },
    { code: "water_week", title: "健康饮水", description: "连续 7 天达成饮水目标", icon: "💧" },
    { code: "early_bird", title: "早起鸟", description: "连续 7 天 7 点前打卡", icon: "🌅" },
    { code: "all_habits", title: "全能冠军", description: "单日完成所有习惯", icon: "⭐" },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach,
    });
  }

  console.log("✅ Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
