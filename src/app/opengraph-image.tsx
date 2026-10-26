import { ImageResponse } from "next/og";

export const alt = "redmoth — discover the right AI tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card; pages with their own screenshot or logo override it in generateMetadata.
export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "#ffd500", border: "3px solid #0b0b0b" }} />
          redmoth
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
          <span>No noise.</span>
          <span style={{ background: "#ffd500", padding: "0 16px", alignSelf: "flex-start" }}>Just the right tool.</span>
        </div>
        <div style={{ fontSize: 32, color: "#4a4a45" }}>AI tools, real workflows and honest reviews in one place.</div>
      </div>
    ),
    size,
  );
}
