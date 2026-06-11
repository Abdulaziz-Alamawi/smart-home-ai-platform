import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@smarthome.ai" },
    update: {},
    create: {
      email: "admin@smarthome.ai",
      passwordHash: password,
      fullName: "Platform Admin",
      role: "ADMIN",
      settings: { create: { energyTariff: 0.18, currency: "USD" } },
    },
  });

  const demoPassword = await bcrypt.hash("Demo123!", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@smarthome.ai" },
    update: {},
    create: {
      email: "demo@smarthome.ai",
      passwordHash: demoPassword,
      fullName: "Demo User",
      role: "USER",
      settings: { create: {} },
    },
  });

  // Rooms
  const living = await prisma.room.create({ data: { name: "Living Room", floor: 0, userId: demo.id } });
  const kitchen = await prisma.room.create({ data: { name: "Kitchen", floor: 0, userId: demo.id } });
  const bedroom = await prisma.room.create({ data: { name: "Master Bedroom", floor: 1, userId: demo.id } });

  const deviceSeed = [
    { name: "Living Room Lights", type: "LIGHT", powerRatingKw: 0.4, roomId: living.id, status: "ONLINE", isOn: true },
    { name: "Smart Thermostat", type: "THERMOSTAT", powerRatingKw: 2.2, roomId: living.id, status: "ONLINE", isOn: true },
    { name: "TV", type: "APPLIANCE", powerRatingKw: 0.3, roomId: living.id, status: "OFFLINE", isOn: false },
    { name: "Refrigerator", type: "APPLIANCE", powerRatingKw: 0.15, roomId: kitchen.id, status: "ONLINE", isOn: true },
    { name: "Dishwasher", type: "APPLIANCE", powerRatingKw: 1.1, roomId: kitchen.id, status: "OFFLINE", isOn: false },
    { name: "Bedroom AC", type: "HVAC", powerRatingKw: 1.8, roomId: bedroom.id, status: "ONLINE", isOn: true },
    { name: "EV Charger", type: "EV_CHARGER", powerRatingKw: 7.0, roomId: null, status: "OFFLINE", isOn: false },
    { name: "Front Door Lock", type: "LOCK", powerRatingKw: 0.05, roomId: null, status: "ONLINE", isOn: true },
  ] as const;

  const devices = [];
  for (const d of deviceSeed) {
    devices.push(
      await prisma.device.create({
        data: {
          name: d.name,
          type: d.type as never,
          powerRatingKw: d.powerRatingKw,
          roomId: d.roomId ?? undefined,
          status: d.status as never,
          isOn: d.isOn,
          lastSeenAt: new Date(),
          userId: demo.id,
        },
      })
    );
  }

  // Energy usage: 14 days of hourly data per device.
  const now = new Date();
  const usageRows: { deviceId: string; userId: string; energyKwh: number; cost: number; recordedAt: Date }[] = [];
  const profile = [0.4, 0.3, 0.3, 0.3, 0.4, 0.6, 1.3, 1.6, 1.0, 0.7, 0.7, 0.8, 0.8, 0.7, 0.6, 0.7, 1.0, 1.7, 2.3, 2.4, 1.7, 1.1, 0.7, 0.5];
  for (let day = 13; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      for (const device of devices) {
        if (!device.isOn && Math.random() > 0.3) continue;
        const base = profile[hour] * device.powerRatingKw * 0.25;
        const kwh = Number((base * (0.7 + Math.random() * 0.6)).toFixed(4));
        if (kwh <= 0) continue;
        const recordedAt = new Date(now);
        recordedAt.setDate(now.getDate() - day);
        recordedAt.setHours(hour, 0, 0, 0);
        usageRows.push({
          deviceId: device.id,
          userId: demo.id,
          energyKwh: kwh,
          cost: Number((kwh * 0.18).toFixed(4)),
          recordedAt,
        });
      }
    }
  }
  await prisma.energyUsage.createMany({ data: usageRows });

  // Automation rule
  await prisma.automationRule.create({
    data: {
      name: "Turn off lights at midnight",
      description: "Switches off living-room lights every night",
      trigger: "SCHEDULE",
      conditions: { time: "00:00" },
      actions: [{ deviceId: devices[0].id, isOn: false }],
      userId: demo.id,
    },
  });

  // Schedule
  await prisma.schedule.create({
    data: {
      name: "Charge EV off-peak",
      cron: "0 1 * * *",
      action: { deviceId: devices[6].id, isOn: true },
      deviceId: devices[6].id,
      userId: demo.id,
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: demo.id, type: "INFO", title: "Welcome to Smart Home AI", message: "Your dashboard is ready." },
      { userId: demo.id, type: "WARNING", title: "High consumption detected", message: "Energy use peaked yesterday evening." },
    ],
  });

  console.log("Seed complete:", { admin: admin.email, demo: demo.email, devices: devices.length, usageRows: usageRows.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
