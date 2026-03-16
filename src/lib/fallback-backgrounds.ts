export type RetreatBackground = {
  id: string;
  title: string;
  location: string;
  description: string;
  imageUrl: string;
  credit: string;
  accent: string;
};

export const fallbackBackgrounds: RetreatBackground[] = [
  {
    id: "amber-cove",
    title: "Amber Cove",
    location: "Palawan, Philippines",
    description: "Golden water, slow wind, and enough distance to think well.",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#f4bf68",
  },
  {
    id: "pine-temple",
    title: "Pine Temple",
    location: "Nagano, Japan",
    description: "A quiet treeline and cold air that keeps the room honest.",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#7fb59f",
  },
  {
    id: "desert-dawn",
    title: "Desert Dawn",
    location: "Wadi Rum, Jordan",
    description: "Warm stone tones, long shadows, and no room for clutter.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#d89a64",
  },
  {
    id: "alpine-mist",
    title: "Alpine Mist",
    location: "Dolomites, Italy",
    description: "Clouds moving over the ridgeline like a slow breathing cue.",
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80",
    credit: "Unsplash",
    accent: "#9ec8d2",
  },
  {
    id: "midnight-lagoon",
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
