/* End-to-end production smoke test against a live backend + real Postgres + AI engine. */
const BASE = process.env.E2E_BASE || "http://127.0.0.1:4010/api/v1";

let pass = 0;
let fail = 0;
const results = [];

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    results.push(`  PASS  ${name}${detail ? " — " + detail : ""}`);
  } else {
    fail++;
    results.push(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

async function main() {
  // 1. Health (API + AI engine reachability)
  const health = await req("GET", "/health");
  ok("Health endpoint", health.status === 200 && health.json?.data?.api === true);
  ok("AI engine reachable via backend", health.json?.data?.aiEngine === true);

  // 1b. Register a brand-new user, then log in as that user
  const newEmail = `e2e_${Date.now()}@smarthome.ai`;
  const reg = await req("POST", "/auth/register", {
    body: { email: newEmail, password: "NewUser123!", fullName: "E2E New User" },
  });
  ok("Register new user (201)", reg.status === 201 && !!reg.json?.data?.accessToken, newEmail);
  const newLogin = await req("POST", "/auth/login", { body: { email: newEmail, password: "NewUser123!" } });
  ok("Login as new user (200)", newLogin.status === 200 && !!newLogin.json?.data?.accessToken);
  const newToken = newLogin.json?.data?.accessToken;
  const newMe = await req("GET", "/auth/me", { token: newToken });
  ok("New user /auth/me", newMe.status === 200 && newMe.json?.data?.email === newEmail);
  const dupReg = await req("POST", "/auth/register", {
    body: { email: newEmail, password: "NewUser123!", fullName: "Dup" },
  });
  ok("Duplicate email rejected (409)", dupReg.status === 409);

  // 2. Auth: invalid login rejected
  const bad = await req("POST", "/auth/login", { body: { email: "demo@smarthome.ai", password: "wrong" } });
  ok("Reject invalid credentials (401)", bad.status === 401);

  // 3. Auth: demo login
  const login = await req("POST", "/auth/login", { body: { email: "demo@smarthome.ai", password: "Demo123!" } });
  ok("Demo login (200)", login.status === 200 && !!login.json?.data?.accessToken);
  const token = login.json?.data?.accessToken;
  const refreshToken = login.json?.data?.refreshToken;

  // 4. Protected route blocked without token
  const noAuth = await req("GET", "/auth/me");
  ok("Protected route blocked without token (401)", noAuth.status === 401);

  // 5. /auth/me with token
  const me = await req("GET", "/auth/me", { token });
  ok("Authenticated /auth/me", me.status === 200 && me.json?.data?.email === "demo@smarthome.ai");

  // 6. Refresh token rotation
  const refreshed = await req("POST", "/auth/refresh", { body: { refreshToken } });
  ok("Refresh token rotation", refreshed.status === 200 && !!refreshed.json?.data?.accessToken);

  // 7. Devices list (real data from Postgres)
  const devices = await req("GET", "/devices?pageSize=100", { token });
  ok("List devices from Postgres", devices.status === 200 && devices.json?.items?.length >= 8,
    `count=${devices.json?.items?.length}`);
  const firstDevice = devices.json?.items?.[0];

  // 8. Device stats
  const stats = await req("GET", "/devices/stats", { token });
  ok("Device stats aggregation", stats.status === 200 && typeof stats.json?.data?.total === "number");

  // 9. Toggle a device (write to Postgres)
  let toggled = { status: 0 };
  if (firstDevice) {
    toggled = await req("POST", `/devices/${firstDevice.id}/toggle`, { token, body: { isOn: !firstDevice.isOn } });
  }
  ok("Toggle device (DB write)", toggled.status === 200);

  // 10. Create + delete a device
  const created = await req("POST", "/devices", { token, body: { name: "E2E Test Plug", type: "PLUG", powerRatingKw: 0.3 } });
  ok("Create device", created.status === 201 && !!created.json?.data?.id);
  if (created.json?.data?.id) {
    const del = await req("DELETE", `/devices/${created.json.data.id}`, { token });
    ok("Delete device", del.status === 200);
  }

  // 11. Rooms
  const rooms = await req("GET", "/rooms", { token });
  ok("List rooms", rooms.status === 200 && Array.isArray(rooms.json?.data));

  // 12. Energy summary + timeseries (real aggregation)
  const summary = await req("GET", "/energy/summary", { token });
  ok("Energy summary aggregation", summary.status === 200 && summary.json?.data?.totalEnergyKwh > 0,
    `kWh=${summary.json?.data?.totalEnergyKwh}`);
  const ts = await req("GET", "/energy/timeseries", { token });
  ok("Energy timeseries", ts.status === 200 && Array.isArray(ts.json?.data) && ts.json.data.length > 0,
    `points=${ts.json?.data?.length}`);

  // 13. Analytics dashboard
  const dash = await req("GET", "/analytics/dashboard", { token });
  ok("Analytics dashboard", dash.status === 200 && dash.json?.data?.devices?.total >= 8);

  // 14. AI: energy prediction THROUGH the backend -> AI engine
  const predict = await req("POST", "/energy/predict", {
    token,
    body: { start_hour: 18, day_of_week: 2, month: 1, temperature: 2, occupancy: 3, active_devices: 6, horizon: 24 },
  });
  ok("AI energy forecast via backend", predict.status === 200 && predict.json?.data?.forecast?.length === 24,
    `total=${predict.json?.data?.total_predicted_kwh}`);

  // 15. AI: generate recommendations THROUGH the backend -> AI engine -> persisted
  const recs = await req("POST", "/recommendations/generate", { token });
  ok("AI recommendations generated + persisted", recs.status === 201 && Array.isArray(recs.json?.data) && recs.json.data.length >= 1,
    `count=${recs.json?.data?.length}`);

  // 16. Notifications
  const notifs = await req("GET", "/notifications", { token });
  ok("List notifications", notifs.status === 200 && Array.isArray(notifs.json?.items));

  // 17. Settings get + update
  const getSettings = await req("GET", "/settings", { token });
  ok("Get settings", getSettings.status === 200 && !!getSettings.json?.data);
  const updSettings = await req("PATCH", "/settings", { token, body: { energyTariff: 0.21 } });
  ok("Update settings", updSettings.status === 200 && updSettings.json?.data?.energyTariff === 0.21);

  // 18. RBAC: USER blocked from admin-only audit logs
  const audit = await req("GET", "/audit-logs", { token });
  ok("RBAC blocks USER from audit logs (403)", audit.status === 403);

  // 19. Validation: bad device payload rejected
  const badDevice = await req("POST", "/devices", { token, body: { name: "" } });
  ok("Zod validation rejects bad payload (400)", badDevice.status === 400);

  // 20. Admin login + audit access
  const adminLogin = await req("POST", "/auth/login", { body: { email: "admin@smarthome.ai", password: "Admin123!" } });
  const adminToken = adminLogin.json?.data?.accessToken;
  const adminAudit = await req("GET", "/audit-logs", { token: adminToken });
  ok("Admin can access audit logs", adminAudit.status === 200 && Array.isArray(adminAudit.json?.items),
    `entries=${adminAudit.json?.total}`);

  console.log("\n================ E2E PRODUCTION SMOKE TEST ================");
  console.log(results.join("\n"));
  console.log("----------------------------------------------------------");
  console.log(`TOTAL: ${pass + fail}  |  PASSED: ${pass}  |  FAILED: ${fail}`);
  console.log("==========================================================\n");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E harness crashed:", e);
  process.exit(1);
});
