"use client";
import { useState } from "react";

interface Props {
  command?: string;
  big?: boolean;
}

export default function CommandLine({
  command = "curl -fsSL https://cosmiq.ai/install.sh | bash",
  big = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(command).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`cmd${big ? " big" : ""}`}>
      <code>
        <span className="prompt" aria-hidden="true">
          ${" "}
        </span>
        {command}
      </code>
      <button type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

