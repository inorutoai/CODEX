import { randomBytes, createHmac } from "node:crypto";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
const stack = "dev/.env.local-stack";
if (!existsSync(stack))
  writeFileSync(
    stack,
    `LOCAL_DB_PASSWORD=${randomBytes(24).toString("hex")}\nLOCAL_JWT_SECRET=${randomBytes(32).toString("hex")}\n`,
    { mode: 0o600, flag: "wx" },
  );
if (existsSync(".env.local")) {
  console.log(".env.local exists; preserved.");
  process.exit(0);
}
const secret = readFileSync(stack, "utf8").match(/^LOCAL_JWT_SECRET=(.+)$/m)[1];
const base64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const payload = base64({
  role: "anon",
  iss: "local-security-dev",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 315360000,
});
const input = base64({ alg: "HS256", typ: "JWT" }) + "." + payload;
const key =
  input + "." + createHmac("sha256", secret).update(input).digest("base64url");
writeFileSync(
  ".env.local",
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Local-only credentials initialized; public anon key saved to ignored .env.local.",
);
