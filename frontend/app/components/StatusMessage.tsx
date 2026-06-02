import React from "react";
import "./StatusMessage.css";

interface StatusMessageProps {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}

export default function StatusMessage({ type, message, onClose }: StatusMessageProps) {
  const isError = type === "error";

  return (
    <div className="status-msg-card">
      <div className="status-msg-inner">
        
        {/* Layout Wrapper for Icon + Text Content */}
        <div className="status-msg-content-wrapper">
          <img
            src={isError ? "/assets/empty_treasure.png" : "/assets/full_treasure.png"}
            alt={isError ? "Error" : "Success"}
            className="status-msg-icon"
          />
          
          {/* Text Container blocks title and body together */}
          <div className="status-msg-text-group">
            <span className="status-msg-title">
              {isError ? "Error" : "Successful"}
            </span>
            <p className="status-msg-body">{message}</p>
          </div>
        </div>
        
        {/* Absolute positioned close button */}
        <button className="rpg-close-btn" onClick={onClose}>
          <img src="/assets/cross_btn.png" alt="Close" className="default-cross" />
          <img src="/assets/cross_btn_hover.png" alt="Close" className="hover-cross" />
        </button>
      </div>
    </div>
  );
}