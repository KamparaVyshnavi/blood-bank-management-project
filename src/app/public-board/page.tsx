import { PublicBoard } from "@/components/portals/public-board";

export const metadata = { title: "Public Board" };

export default function Page() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PUBLIC DIRECTORY</p>
          <h1>Public Board</h1>
          <p className="page-description">District availability with a cached, privacy-preserving view.</p>
        </div>
      </div>
      <PublicBoard />
    </>
  );
}
