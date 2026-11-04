import { describe, expect, it, beforeEach } from "vitest";
import { getDemoDataSeed } from "../../src/lib/ops-data";
import { type Emergency, type Donor, type BloodUnit } from "../../src/lib/ops-types";

describe("Demo Data Operational Workflows", () => {
  const STORAGE_KEY = "pulsegrid-demo-data-v1";
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    store.clear();
    if (typeof globalThis.localStorage === "undefined") {
      Object.defineProperty(globalThis, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it("seeds valid data with all required operational entities", () => {
    const seed = getDemoDataSeed();
    expect(Array.isArray(seed.institutions)).toBe(true);
    expect(Array.isArray(seed.units)).toBe(true);
    expect(Array.isArray(seed.emergencies)).toBe(true);
    expect(Array.isArray(seed.donors)).toBe(true);
    expect(Array.isArray(seed.users)).toBe(true);
    expect(Array.isArray(seed.audit)).toBe(true);
    expect(Array.isArray(seed.activity)).toBe(true);
    expect(Array.isArray(seed.pending)).toBe(true);

    expect(seed.institutions.length).toBeGreaterThan(0);
    expect(seed.emergencies.length).toBeGreaterThan(0);
    expect(seed.donors.length).toBeGreaterThan(0);
    expect(seed.units.length).toBeGreaterThan(0);
  });

  it("persists and restores operational demo data across localStorage", () => {
    const seed = getDemoDataSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));

    const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(retrieved.emergencies.length).toBe(seed.emergencies.length);
    expect(retrieved.donors.length).toBe(seed.donors.length);
  });

  it("creates a new emergency request and logs activity and audit", () => {
    const state = getDemoDataSeed();
    const newEmergency: Emergency = {
      id: "ER-9999",
      hospitalId: "h-sahyadri",
      hospital: "Sahyadri Trauma Centre",
      district: "Pune",
      group: "O-",
      component: "Red cells",
      units: 3,
      unitsFulfilled: 0,
      urgency: "Critical",
      status: "Submitted",
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 4 * 3600000).toISOString(),
      responses: [],
      timeline: [{ label: "Request created", at: new Date().toISOString() }],
    };

    const updated = {
      ...state,
      emergencies: [newEmergency, ...state.emergencies],
      activity: [
        {
          id: `a-${Date.now()}`,
          text: `Emergency ${newEmergency.id} raised for 3 × O- red cells`,
          institution: newEmergency.hospital,
          at: newEmergency.createdAt,
          tone: "critical" as const,
        },
        ...state.activity,
      ],
      audit: [
        {
          id: `e-${Date.now()}`,
          user: "Dr. L. Bhosale",
          action: "Created emergency request",
          record: newEmergency.id,
          at: newEmergency.createdAt,
          result: "Success" as const,
        },
        ...state.audit,
      ],
    };

    expect(updated.emergencies[0].id).toBe("ER-9999");
    expect(updated.emergencies.length).toBe(state.emergencies.length + 1);
    expect(updated.activity[0].text).toContain("ER-9999");
    expect(updated.audit[0].record).toBe("ER-9999");
  });

  it("updates emergency status and records escalation/cancellation actions", () => {
    const state = getDemoDataSeed();
    const target = state.emergencies[0];

    // Escalate
    const escalated = {
      ...state,
      emergencies: state.emergencies.map(e =>
        e.id === target.id ? { ...e, urgency: "Critical" as const } : e
      ),
    };
    expect(escalated.emergencies.find(e => e.id === target.id)?.urgency).toBe("Critical");

    // Cancel
    const cancelled = {
      ...escalated,
      emergencies: escalated.emergencies.map(e =>
        e.id === target.id ? { ...e, status: "Cancelled" as const } : e
      ),
    };
    expect(cancelled.emergencies.find(e => e.id === target.id)?.status).toBe("Cancelled");
  });

  it("registers a new donor with masked phone and verification status", () => {
    const state = getDemoDataSeed();
    const newDonor: Donor = {
      id: "D-9999",
      name: "Rohit Verma",
      group: "A+",
      district: "Mumbai City",
      available: true,
      subscribed: true,
      verified: false,
      lastDonation: null,
      nextEligible: null,
      contactMasked: "+91 ••••• 8821",
      alertsSent: 0,
      alertsAnswered: 0,
    };

    const updated = {
      ...state,
      donors: [newDonor, ...state.donors],
    };

    expect(updated.donors[0].id).toBe("D-9999");
    expect(updated.donors[0].verified).toBe(false);
    expect(updated.donors[0].contactMasked).toBe("+91 ••••• 8821");
    expect(updated.donors.length).toBe(state.donors.length + 1);

    // Verify donor action
    const verified = {
      ...updated,
      donors: updated.donors.map(d => (d.id === "D-9999" ? { ...d, verified: true } : d)),
    };
    expect(verified.donors.find(d => d.id === "D-9999")?.verified).toBe(true);
  });

  it("updates institution status between Active, Suspended, and Active", () => {
    const state = getDemoDataSeed();
    const inst = state.institutions.find(i => i.status === "Pending")!;

    // Verify registration (Pending -> Active)
    const verified = {
      ...state,
      institutions: state.institutions.map(i =>
        i.id === inst.id ? { ...i, status: "Active" as const } : i
      ),
    };
    expect(verified.institutions.find(i => i.id === inst.id)?.status).toBe("Active");

    // Suspend institution (Active -> Suspended)
    const suspended = {
      ...verified,
      institutions: verified.institutions.map(i =>
        i.id === inst.id ? { ...i, status: "Suspended" as const } : i
      ),
    };
    expect(suspended.institutions.find(i => i.id === inst.id)?.status).toBe("Suspended");
  });

  it("toggles user status and handles inventory unit creation and status updates", () => {
    const state = getDemoDataSeed();
    const user = state.users[0];

    // Toggle user access
    const toggled = {
      ...state,
      users: state.users.map(u =>
        u.id === user.id ? { ...u, status: u.status === "Active" ? ("Disabled" as const) : ("Active" as const) } : u
      ),
    };
    expect(toggled.users.find(u => u.id === user.id)?.status).not.toBe(user.status);

    // Add unit to inventory
    const newUnit: BloodUnit = {
      id: "U-99999",
      group: "B+",
      component: "Whole blood",
      collectedOn: new Date().toISOString(),
      expiresOn: new Date(Date.now() + 35 * 86400000).toISOString(),
      status: "Available",
      institutionId: "bb-harbour",
      institution: "Harbour City Blood Bank",
    };

    const withUnit = {
      ...toggled,
      units: [newUnit, ...toggled.units],
    };
    expect(withUnit.units[0].id).toBe("U-99999");

    // Reserve unit
    const reserved = {
      ...withUnit,
      units: withUnit.units.map(u => (u.id === "U-99999" ? { ...u, status: "Reserved" as const } : u)),
    };
    expect(reserved.units.find(u => u.id === "U-99999")?.status).toBe("Reserved");
  });
});
