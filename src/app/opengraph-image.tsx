import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const alt = "redmoth — discover the right AI tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card; pages with their own screenshot or logo override it in generateMetadata.
export default async function Image() {
  // The wordmark, inlined: the image renderer can't fetch from our own public folder.
  const logo = await readFile(path.join(process.cwd(), "public", "redmoth-logos", "site-logo.svg"), "base64");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f7f7f4",
          color: "#0b0b0b",
        }}
      >
        <img src={`data:image/svg+xml;base64,${logo}`} alt="" width={364} height={84} />
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
          <span>No noise.</span>
          <span style={{ background: "#ea2629", color: "#ffffff", padding: "0 16px", alignSelf: "flex-start" }}>Just the right tool.</span>
        </div>
        <div style={{ fontSize: 32, color: "#4a4a45" }}>AI tools, real workflows and honest reviews in one place.</div>
      </div>
    ),
    size,
  );
}
