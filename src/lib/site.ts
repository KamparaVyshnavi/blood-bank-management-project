export const site = {
  name: "PulseGrid",
  qualifier: "Platform",
  disclaimer: "PulseGrid — Cloud-Based Blood Bank Management & Emergency Coordination Platform.",
  districts: ["Mumbai City", "Mumbai Suburban", "Thane", "Pune"],
  seed: "monsoon",
  startedAt: "2026-10-28T03:30:00Z"
} as const;

export const features = {
  inventory: { title: "Inventory", section: "Registry", stage: "02", description: "Blood stock, screening gates, and component lifecycles.", empty: "No units match these filters", detail: "Demonstrates FEFO and controlled lifecycle operations." },
  "match-lab": { title: "Match Lab", section: "Registry", stage: "02", description: "Explore compatibility rules behind an explainable match.", empty: "Choose a component and recipient", detail: "The interactive grid explains independently tested red-cell, plasma, and identical-only platelet rules." },
  "code-red": { title: "Emergency Coordination", section: "Operations", stage: "04", description: "Follow an emergency from request to outcome.", empty: "No emergency workflow running", detail: "Includes stock reservations, donor waves, screening, dispatch and handover." },
  bank: { title: "Bank portal", section: "Portals", stage: "06", description: "Workspace for bank inventory and controlled issue.", empty: "Bank access is not configured", detail: "Server-validated identity and tenant isolation with bank workflow." },
  hospital: { title: "Hospital portal", section: "Portals", stage: "06", description: "Create, track, and complete requests with traceable handover.", empty: "Hospital access is not configured", detail: "Authenticated requests and allocations." },
  duel: { title: "The Duel", section: "Operations", stage: "06", description: "Two hospitals. One unit. One active owner.", empty: "Choose a reservation model", detail: "Explains naive and conditional updates. The reservation API uses a MongoDB replica set." },
  "public-board": { title: "Public Board", section: "Registry", stage: "08", description: "District-level availability with privacy built into the aggregate.", empty: "No public aggregate available", detail: "Cached district, group, and component bands. No donor details or exact inventory counts." }
} as const;

export type FeatureKey = keyof typeof features;
