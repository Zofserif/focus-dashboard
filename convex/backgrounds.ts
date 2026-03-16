import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const backgroundSeed = [
  {
    slug: "amber-cove",
    title: "Amber Cove",
    location: "Palawan, Philippines",
    description: "Golden water, slow wind, and enough distance to think well.",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#f4bf68",
  },
  {
    slug: "pine-temple",
    title: "Pine Temple",
    location: "Nagano, Japan",
    description: "A quiet treeline and cold air that keeps the room honest.",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#7fb59f",
  },
  {
    slug: "desert-dawn",
    title: "Desert Dawn",
    location: "Wadi Rum, Jordan",
    description: "Warm stone tones, long shadows, and no room for clutter.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#d89a64",
  },
  {
    slug: "alpine-mist",
    title: "Alpine Mist",
    location: "Dolomites, Italy",
    description: "Clouds moving over the ridgeline like a slow breathing cue.",
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#9ec8d2",
  },
  {
    slug: "midnight-lagoon",
    title: "Midnight Lagoon",
    location: "Lofoten, Norway",
    description:
      "A colder palette for deep work when you want the room to disappear.",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#88a4d8",
  },
];

const backgroundShape = v.object({
  accent: v.string(),
  credit: v.string(),
  description: v.string(),
  id: v.string(),
  imageUrl: v.string(),
  location: v.string(),
  title: v.string(),
});

export const list = queryGeneric({
  args: {},
  returns: v.array(backgroundShape),
  handler: async (ctx) => {
    const backgrounds = await ctx.db.query("backgrounds").collect();

    return backgrounds.map((background) => ({
      id: background.slug,
      title: background.title,
      location: background.location,
      description: background.description,
      imageUrl: background.imageUrl,
      credit: background.credit,
      accent: background.accent,
    }));
  },
});

export const seed = mutationGeneric({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let inserted = 0;

    for (const background of backgroundSeed) {
      const existing = await ctx.db
        .query("backgrounds")
        .withIndex("by_slug", (query) => query.eq("slug", background.slug))
        .unique();

      if (existing) {
        continue;
      }

      await ctx.db.insert("backgrounds", background);
      inserted += 1;
    }

    return inserted;
  },
});
