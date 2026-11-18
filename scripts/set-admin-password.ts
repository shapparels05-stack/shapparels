// Change an admin's login password (no admin screen for this yet).
//
//   npx tsx --env-file=.env.local scripts/set-admin-password.ts [email]
//
// Prompts for the new password with hidden input (never passed as an argument,
// so it doesn't end up in shell history), then signs that admin out of every
// device so the old password can't keep an existing session alive.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { user, account, session } from "../lib/db/schema/auth";

const MIN_LENGTH = 10;

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("Run this in a real terminal (needs hidden keyboard input)."));
      return;
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set (run with --env-file=.env.local)");
    process.exit(1);
  }
  const email = (process.argv[2] || "admin@shapparels.pk").trim().toLowerCase();

  const sql = postgres(connectionString);
  const db = drizzle(sql);
  try {
    const [admin] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (!admin) {
      console.error(`No user with email ${email}`);
      process.exitCode = 1;
      return;
    }

    const pw = await askHidden(`New password for ${email}: `);
    if (pw.length < MIN_LENGTH) {
      console.error(`Password must be at least ${MIN_LENGTH} characters. Nothing changed.`);
      process.exitCode = 1;
      return;
    }
    const confirm = await askHidden("Type it again: ");
    if (pw !== confirm) {
      console.error("Passwords don't match. Nothing changed.");
      process.exitCode = 1;
      return;
    }

    const updated = await db
      .update(account)
      .set({ password: await hashPassword(pw), updatedAt: new Date() })
      .where(and(eq(account.userId, admin.id), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (updated.length === 0) {
      console.error("This user has no password login account. Nothing changed.");
      process.exitCode = 1;
      return;
    }

    const ended = await db
      .delete(session)
      .where(eq(session.userId, admin.id))
      .returning({ id: session.id });
    console.log(`Password changed for ${email}. Signed out of ${ended.length} session(s).`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
