import { hashPassword, verifyPassword } from "../../src/utils/password";

describe("password hashing", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("Secret123!");
    expect(hash).not.toBe("Secret123!");
    expect(await verifyPassword("Secret123!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Secret123!");
    expect(await verifyPassword("WrongPass", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salting)", async () => {
    const a = await hashPassword("samePassword1");
    const b = await hashPassword("samePassword1");
    expect(a).not.toBe(b);
  });
});
