/** Shown on screens whose actions only change local state until the backend is connected. */
export function PlaceholderNote({ children }: { children?: React.ReactNode }) {
  return <p className="ds-note" role="note">{children ?? "Sample data. Changes you make here stay in this browser tab until the backend is connected."}</p>;
}
