"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

import type { ServiceFlags } from "~/lib/service-flags";

const defaultServices: ServiceFlags = {
  clerk: false,
  convex: false,
  posthog: false,
};

const ServicesContext = createContext<ServiceFlags>(defaultServices);

export function useServiceFlags() {
  return useContext(ServicesContext);
}

function ServicesProvider({
  children,
  services,
}: PropsWithChildren<{ services: ServiceFlags }>) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

function ConvexBoundary({
  children,
  convexUrl,
}: PropsWithChildren<{ convexUrl: string }>) {
  const [client] = useState(() => new ConvexReactClient(convexUrl));

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

export function AppProviders({
  children,
  services,
  convexUrl,
}: PropsWithChildren<{
  services: ServiceFlags;
  convexUrl?: string;
}>) {
  let tree = (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  );

  if (convexUrl) {
    tree = <ConvexBoundary convexUrl={convexUrl}>{tree}</ConvexBoundary>;
  }

  if (services.clerk) {
    tree = <ClerkProvider>{tree}</ClerkProvider>;
  }

  return tree;
}
