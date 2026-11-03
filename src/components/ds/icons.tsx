const paths = {
  overview: "M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-16v3h6V4h-6Z",
  inventory: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z",
  emergency: "M12 3 2.5 20h19L12 3Zm0 6v5m0 3v.01",
  institutions: "M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6M12 9v3",
  donors: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  reports: "M5 20V10m5 10V4m5 16v-7m5 7H3",
  admin: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Zm-2.5 9 2 2 3.5-4",
  labs: "M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 3-4.5-4.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m9 6 6 6-6 6",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  clock: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-13v5l3 2",
  check: "m5 12.5 4.5 4.5L19 7.5",
  alert: "M12 8v5m0 3.5v.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  back: "m15 6-6 6 6 6",
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="ds-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default Icon;
