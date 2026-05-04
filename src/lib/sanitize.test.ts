import { describe, it, expect } from "vitest";
import { sanitize, isSensitiveKey, isSensitiveValue } from "./sanitize";

describe("Sanitize Helper", () => {
  it("should detect sensitive keys", () => {
    expect(isSensitiveKey("api_key")).toBe(true);
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("sk_live")).toBe(true);
    expect(isSensitiveKey("normal_field")).toBe(false);
  });

  it("should detect sensitive values (JWT, Stripe keys, etc.)", () => {
    expect(isSensitiveValue("sk_live_1234567890abcdef")).toBe(true);
    expect(isSensitiveValue("bearer xyz.123.abc")).toBe(true);
    expect(isSensitiveValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")).toBe(true);
    expect(isSensitiveValue("normal_string")).toBe(false);
  });

  it("should mask sensitive data while keeping last 4 chars", () => {
    const input = { api_key: "sk_live_mysecret1234" };
    const output = sanitize(input);
    expect(output.api_key).toBe("****1234");
  });

  it("should sanitize nested objects", () => {
    const input = {
      user: {
        name: "John",
        credentials: {
          password: "mysecretpassword"
        }
      }
    };
    const output = sanitize(input);
    expect(output.user.credentials.password).toBe("****word");
  });

  it("should sanitize arrays of objects", () => {
    const input = [
      { secret: "secret1" },
      { secret: "secret2" }
    ];
    const output = sanitize(input);
    expect(output[0].secret).toBe("****ret1");
    expect(output[1].secret).toBe("****ret2");
  });

  it("should mask JWT tokens even in non-sensitive keys", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const input = { some_token: token };
    const output = sanitize(input);
    // JWT has a lot of chars, will keep last 4
    expect(output.some_token.endsWith(token.slice(-4))).toBe(true);
    expect(output.some_token.startsWith("****")).toBe(true);
  });
});
