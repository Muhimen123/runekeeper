"use client";

import React, { useState } from "react";
import "./sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GameEvent {
  id: string;
  roomName: string;
  courseName: string;
  eventType: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
}

type SidebarView = "menu" | "events";

const DEFAULT_COURSES = ["CSE-315", "CSE-316", "CSE-317"];
const DEFAULT_EVENT_TYPES = ["CT1", "Assignment", "Lab Quiz"];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [activeView, setActiveView] = useState<SidebarView>("menu");

  const [courses] = useState<string[]>(DEFAULT_COURSES);
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_EVENT_TYPES);
  const [events, setEvents] = useState<GameEvent[]>([
    {
      id: "1",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
    {
      id: "2",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
    {
      id: "3",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
    {
      id: "4",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
    {
      id: "5",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
    {
      id: "6",
      roomName: "L2T1",
      courseName: "DSA",
      eventType: "CT-1",
      eventName: "Class Test 1",
      eventDate: "2026-06-01",
      eventTime: "10:30",
      location: "Room 102",
    },
  ]);

  const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isNewEventTypeOpen, setIsNewEventTypeOpen] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(DEFAULT_COURSES[0]);
  const [selectedEventType, setSelectedEventType] = useState(DEFAULT_EVENT_TYPES[0]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddNewEventType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed || eventTypes.includes(trimmed)) return;
    setEventTypes((prev) => [...prev, trimmed]);
    setSelectedEventType(trimmed);
    setNewTypeName("");
    setIsNewEventTypeOpen(false);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !eventTime) return;

    const newEvent: GameEvent = {
      id: String(Date.now()),
      roomName: "L2T1",
      courseName: selectedCourse,
      eventType: selectedEventType,
      eventName: eventName.trim(),
      eventDate,
      eventTime,
      location: eventLocation.trim(),
    };

    setEvents((prev) => [...prev, newEvent]);
    setEventName("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setIsAddEventOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDisplayTime = (timeStr: string): string => {
    if (!timeStr) return "—";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? "pm" : "am"}`;
  };

  const filteredEvents = events.filter((ev) => {
    const term = searchQuery.toLowerCase();
    return (
      ev.eventName.toLowerCase().includes(term) ||
      ev.courseName.toLowerCase().includes(term) ||
      ev.eventType.toLowerCase().includes(term) ||
      ev.location.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className={`rpg-sidebar ${isOpen ? "open" : ""}`}>
        <div className="rpg-sidebar-inner">

          {/* Header */}
          <div className="rpg-sidebar-header">
            {activeView === "events" ? (
              <button className="rpg-back-btn" onClick={() => setActiveView("menu")}>
                ←
              </button>
            ) : (
              <div />
            )}

            {activeView === "events" && (
              <h2 className="rpg-sidebar-title">Upcoming Events</h2>
            )}

            <button className="rpg-close-btn" onClick={onClose}>
              <img src="/assets/cancel.png" alt="Close" />
            </button>
          </div>

          {/* Main Menu */}
          {activeView === "menu" && (
            <div className="sidebar-menu">
              <div className="rpg-wood-btn-wrap">
                <button className="rpg-wood-btn" onClick={() => setActiveView("events")}>
                  Upcoming Events
                </button>
              </div>
              <div className="rpg-wood-btn-wrap">
                <button className="rpg-wood-btn">
                  AI Chat
                </button>
              </div>
              <div className="rpg-wood-btn-wrap">
                <button className="rpg-wood-btn">
                  Track Progress
                </button>
              </div>
            </div>
          )}

          {/* Events View */}
          {activeView === "events" && (
            <>
              <div className="sidebar-events-list">
                {events.slice(0, 3).map((ev) => (
                  <div key={ev.id} className="event-card">
                    <img
                      src="/assets/quest.png"
                      alt="Quest"
                      className="event-card-quest-icon"
                    />
                    <div className="event-card-details">
                      <div className="event-card-title">{ev.eventType}</div>
                      <div>{ev.courseName}</div>
                      <div>{ev.location}</div>
                      <div>{formatDisplayDate(ev.eventDate)}</div>
                      <div>{formatDisplayTime(ev.eventTime)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-events-footer">
                <div className="rpg-wood-btn-wrap">
                  <button className="rpg-wood-btn" onClick={() => setIsAllEventsOpen(true)}>
                    Show all events
                  </button>
                </div>
                <div className="rpg-wood-btn-wrap">
                  <button className="rpg-wood-btn" onClick={() => setIsAddEventOpen(true)}>
                    Add event
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Modal: All Events */}
      {isAllEventsOpen && (
        <div className="modal-backdrop" onClick={() => setIsAllEventsOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-inner">
              <div className="rpg-modal-header">
                <img src="/assets/quest.png" alt="Quest" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">All Upcoming Events</h3>
                <button
                  className="rpg-close-btn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setIsAllEventsOpen(false)}
                >
                  <img src="/assets/cancel.png" alt="Close" />
                </button>
              </div>

              <div className="rpg-search-container">
                <img src="/assets/search.png" alt="Search" className="rpg-search-icon" />
                <input
                  type="text"
                  className="rpg-search-input"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="all-events-scroll">
                {filteredEvents.map((ev) => (
                  <div key={ev.id} className="all-events-row">
                    <div className="all-events-card">
                      {ev.eventType} · {ev.courseName} · {ev.location} · {formatDisplayDate(ev.eventDate)} · {formatDisplayTime(ev.eventTime)}
                    </div>
                    <button
                      className="rpg-trash-btn"
                      onClick={() => handleDeleteEvent(ev.id)}
                    >
                      <img src="/assets/bin.png" alt="Delete" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Event */}
      {isAddEventOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddEventOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <form className="rpg-modal-inner" onSubmit={handleCreateEvent}>
              <div className="rpg-modal-header">
                <img src="/assets/quest.png" alt="Quest" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">Add Event</h3>
              </div>

              <div className="rpg-form-grid">
                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Room Name</label>
                  <input
                    type="text"
                    className="rpg-modal-input rpg-form-input-disabled"
                    value="L2T1"
                    disabled
                  />
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Course Name</label>
                  <select
                    className="rpg-form-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Event Type</label>
                  <div className="rpg-select-row">
                    <select
                      className="rpg-form-select"
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value)}
                    >
                      {eventTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rpg-plus-btn"
                      onClick={() => setIsNewEventTypeOpen(true)}
                    >
                      <img src="/assets/add.png" alt="Add type" />
                    </button>
                  </div>
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Event Name</label>
                  <input
                    type="text"
                    className="rpg-modal-input"
                    placeholder="e.g. Class Test 1"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Event Date</label>
                  <input
                    type="date"
                    className="rpg-modal-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Event Time</label>
                  <input
                    type="time"
                    className="rpg-modal-input"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                  />
                </div>

                <div className="rpg-form-row">
                  <label className="rpg-modal-label">Location</label>
                  <input
                    type="text"
                    className="rpg-modal-input"
                    placeholder="e.g. Room 301"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rpg-modal-footer">
                <button type="button" className="rpg-icon-btn" onClick={() => setIsAddEventOpen(false)}>
                  <img src="/assets/cancel.png" alt="Cancel" />
                </button>
                <button type="submit" className="rpg-icon-btn">
                  <img src="/assets/ok.png" alt="Confirm" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Event Type */}
      {isNewEventTypeOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewEventTypeOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-inner">
              <div className="rpg-modal-header">
                <img src="/assets/quest.png" alt="Quest" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">New Event Type</h3>
              </div>
              <div className="rpg-modal-body">
                <label className="rpg-modal-label">Type Name</label>
                <input
                  type="text"
                  className="rpg-modal-input"
                  placeholder="e.g. Midterm Exam"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="rpg-modal-footer">
                <button className="rpg-icon-btn" onClick={() => setIsNewEventTypeOpen(false)}>
                  <img src="/assets/cancel.png" alt="Cancel" />
                </button>
                <button className="rpg-icon-btn" onClick={handleAddNewEventType}>
                  <img src="/assets/ok.png" alt="Confirm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
