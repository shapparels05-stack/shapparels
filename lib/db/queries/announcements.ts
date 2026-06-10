import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getActiveAnnouncements() {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt));
}

export async function getAllAnnouncements() {
  return db
    .select()
    .from(announcements)
    .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt));
}
