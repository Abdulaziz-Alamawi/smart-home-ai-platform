import request from "supertest";

// In-memory Prisma mock covering the auth flow.
type AnyRec = Record<string, any>;
const db = {
  users: [] as AnyRec[],
  refreshTokens: [] as AnyRec[],
  settings: [] as AnyRec[],
};

let idCounter = 1;
const nextId = () => `id-${idCounter++}`;

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(async ({ where }: AnyRec) => {
        return (
          db.users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null
        );
      }),
      create: jest.fn(async ({ data }: AnyRec) => {
        const user = {
          id: nextId(),
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          role: data.role ?? "USER",
          isActive: true,
          avatarUrl: null,
        };
        db.users.push(user);
        if (data.settings?.create) db.settings.push({ userId: user.id, ...data.settings.create });
        return user;
      }),
    },
    refreshToken: {
      create: jest.fn(async ({ data }: AnyRec) => {
        const t = { id: nextId(), revoked: false, ...data };
        db.refreshTokens.push(t);
        return t;
      }),
      findUnique: jest.fn(async ({ where }: AnyRec) =>
        db.refreshTokens.find((t) => t.token === where.token) ?? null
      ),
      update: jest.fn(async ({ where, data }: AnyRec) => {
        const t = db.refreshTokens.find((x) => x.token === where.token);
        if (t) Object.assign(t, data);
        return t;
      }),
      updateMany: jest.fn(async ({ where, data }: AnyRec) => {
        let count = 0;
        db.refreshTokens
          .filter((t) => t.token === where.token)
          .forEach((t) => {
            Object.assign(t, data);
            count++;
          });
        return { count };
      }),
    },
  },
}));

import { createApp } from "../../src/app";

const app = createApp();

describe("Auth API", () => {
  const creds = { email: "user@test.com", password: "Secret123!", fullName: "Test User" };

  it("rejects registration with invalid payload", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: "bad" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("registers a new user and returns tokens", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(creds.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("prevents duplicate registration", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(creds);
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: creds.email, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid access token", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: creds.email, password: creds.password });
    const token = login.body.data.accessToken;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(creds.email);
  });

  it("blocks /me without a token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
