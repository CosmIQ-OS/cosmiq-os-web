"use client";

import WhatsAppIcon from "./WhatsAppIcon";

export default function WhatsAppFloatingWidget() {
  return (
    <aside aria-label="Direct WhatsApp contact" className="whatsapp-float-container">
      <a
        href="https://wa.me/919847594827"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Direct chat with CosmIQ OS on WhatsApp (+91 98475 94827)"
      >
        <span className="whatsapp-float-beacon" aria-hidden="true" />
        <WhatsAppIcon size={18} className="whatsapp-float-icon" />
        <span className="whatsapp-float-text">
          <span className="whatsapp-float-label">WhatsApp</span>
          <span className="whatsapp-float-number">+91 98475 94827</span>
        </span>
        <span className="whatsapp-float-arrow" aria-hidden="true">→</span>
      </a>
    </aside>
  );
}
