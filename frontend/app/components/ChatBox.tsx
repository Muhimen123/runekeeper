import React, { useState } from "react";

interface ChatBoxProps {
  eventsCount: number;
}

export default function ChatBox({ eventsCount }: ChatBoxProps) {
  const [history, setHistory] = useState([
    { sender: "ai", text: "Greetings! I am Runekeeper AI. Ask me about thy quests or exams." }
  ]);
  const [input, setInput] = useState("");

  const handleAsk = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const query = trimmed.toLowerCase();
    let reply = "Thy request is registered. Ask specifically about exams, quests, or help.";
    if (query.includes("event") || query.includes("test") || query.includes("exam") || query.includes("quest")) {
      reply = `You have ${eventsCount} active exams in your scroll. Stay focused, hero!`;
    } else if (query.includes("hello") || query.includes("hi") || query.includes("greetings")) {
      reply = "Salutations, traveler! How may I assist you?";
    } else if (query.includes("summary")) {
      reply = `QUEST SUMMARY: Total Exams/Events in L2T1: ${eventsCount}. Stay vigilant!`;
    }
    setHistory((prev) => [...prev, { sender: "user", text: trimmed }, { sender: "ai", text: reply }]);
    setInput("");
  };

  return (
    <>
      <div className="rpg-chat-box">
        <div className="rpg-chat-history">
          {history.map((m, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <span style={{ color: m.sender === "ai" ? "#7a9e35" : "#a04040", fontWeight: "bold" }}>
                {m.sender === "ai" ? "RuneKeeper: " : "You: "}
              </span>
              {m.text}
            </div>
          ))}
        </div>
        <textarea
          className="rpg-chat-input-area"
          placeholder="Inscribe thy prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk(input);
            }
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div className="rpg-wood-btn-half-wrap">
          <button className="rpg-wood-btn-half" onClick={() => handleAsk("summary")}>
            Summary
          </button>
        </div>
        <div className="rpg-wood-btn-half-wrap">
          <button className="rpg-wood-btn-half" onClick={() => handleAsk(input)}>
            Ask
          </button>
        </div>
      </div>
    </>
  );
}
