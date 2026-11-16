import type { Metadata } from "next";
import StyleguideWorkbench from "@/components/StyleguideWorkbench";

export const metadata: Metadata = {
  title: "Color & Design System Workbench",
  description:
    "Live interactive styleguide to preview, customize, audit WCAG 2.1 contrast, and export color palettes for CosmIQ.",
};

export default function StyleguidePage() {
  return <StyleguideWorkbench />;
}
