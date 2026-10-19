import { ImageResponse } from "next/og";

import { siteConfig } from "../../site.config";
import { defaultLocale, localized } from "@/i18n";

export const dynamic = "force-static";
export const alt = `${siteConfig.name} — ${localized(siteConfig.role, defaultLocale)}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const role = localized(siteConfig.role, defaultLocale);
const pitch = localized(siteConfig.pitch, defaultLocale);
const twoLinePitch =
  pitch.length > 120 ? `${pitch.slice(0, 117).trimEnd()}…` : pitch;
const nameFontSize = siteConfig.name.length > 16 ? 82 : 104;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#050505",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 16,
            height: "100%",
            background: "#00b13f",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -170,
            top: -190,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,177,63,0.34) 0%, rgba(0,177,63,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 82,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(0,177,63,0.35)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            padding: "76px 96px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#43d17a",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#00b13f",
              }}
            />
            {role}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 930,
              fontSize: nameFontSize,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -2,
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 880,
              color: "#b8b8b8",
              fontSize: 34,
              lineHeight: 1.35,
            }}
          >
            {twoLinePitch}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 48,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 64,
                height: 6,
                borderRadius: 3,
                background: "#00b13f",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 22,
                height: 6,
                borderRadius: 3,
                background: "rgba(0,177,63,0.55)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 10,
                height: 6,
                borderRadius: 3,
                background: "rgba(0,177,63,0.28)",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
