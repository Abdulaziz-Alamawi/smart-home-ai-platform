import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt";

const payload = { sub: "user-1", email: "a@b.com", role: "USER" };

describe("jwt utils", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("USER");
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.email).toBe("a@b.com");
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(payload);
    expect(() => verifyAccessToken(token + "tamper")).toThrow();
  });

  it("produces unique refresh tokens on rapid issuance (jti)", () => {
    // Regression: two refresh tokens issued back-to-back must differ so they
    // never collide on the unique RefreshToken.token column.
    const a = signRefreshToken(payload);
    const b = signRefreshToken(payload);
    expect(a).not.toBe(b);
    expect((verifyRefreshToken(a) as unknown as { jti: string }).jti).toBeDefined();
  });
});
