import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  backgrounds: defineTable({
    accent: v.string(),
    credit: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    location: v.string(),
    slug: v.string(),
    title: v.string(),
  }).index("by_slug", ["slug"]),
});
