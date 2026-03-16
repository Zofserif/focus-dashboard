export type ServiceFlags = {
  clerk: boolean;
  convex: boolean;
  posthog: boolean;
};

export function getServiceFlags(): ServiceFlags {
  return {
    clerk: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.CLERK_SECRET_KEY,
    ),
    convex: Boolean(process.env.NEXT_PUBLIC_CONVEX_URL),
    posthog: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  };
}
