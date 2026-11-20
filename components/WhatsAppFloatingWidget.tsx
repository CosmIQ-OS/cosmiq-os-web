"use client";

import WhatsAppIcon from "./WhatsAppIcon";

export default function WhatsAppFloatingWidget() {
  return (
    <aside aria-label="Direct WhatsApp chat" className="whatsapp-float-container">
      <a
        href="https://wa.me/919847594827"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Chat with CosmIQ OS on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className="whatsapp-float-beacon" aria-hidden="true" />
        <WhatsAppIcon size={24} className="whatsapp-float-icon" />
      </a>
    </aside>
  );
}
