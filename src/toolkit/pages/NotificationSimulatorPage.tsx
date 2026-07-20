import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Send, Smartphone } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Pill } from "../../components/common/Badge";
import type { NotificationChannel } from "../types";
import { NOTIFICATION_CHANNELS, NOTIFICATION_DISCLAIMER, NOTIFICATION_EVENTS } from "../config/notificationEvents";
import { notificationRepo } from "../store/toolkitStorage";
import { uid } from "../../utils/storage";

const ROLES = ["Customer", "Owner", "Manager", "Staff", "Salesperson", "Technician"];
const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function NotificationSimulatorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [eventId, setEventId] = useState(NOTIFICATION_EVENTS[0].id);
  const [channel, setChannel] = useState<NotificationChannel>("sms");
  const [role, setRole] = useState("Customer");
  const [message, setMessage] = useState(NOTIFICATION_EVENTS[0].defaultMessage);
  const [history, setHistory] = useState(notificationRepo.loadAll);

  const event = NOTIFICATION_EVENTS.find((e) => e.id === eventId)!;

  const pickEvent = (id: string) => {
    const e = NOTIFICATION_EVENTS.find((x) => x.id === id)!;
    setEventId(id);
    setMessage(e.defaultMessage);
    if (e.suggestedRoles[0]) setRole(e.suggestedRoles[0]);
  };

  const simulate = () => {
    const next = notificationRepo.upsert({
      schemaVersion: 1,
      id: uid(),
      eventId,
      channel,
      recipientRole: role,
      message,
      sentAt: new Date().toISOString(),
    });
    setHistory(next);
    toast("Simulated notification recorded — no external message was sent.", "info");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Bell className="h-5 w-5 text-accent" /> Notification Simulator
        </h1>
        <p className="text-sm text-slate-500">{NOTIFICATION_DISCLAIMER}</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Event</span>
          <select value={eventId} onChange={(e) => pickEvent(e.target.value)} className={inputCls}>
            {NOTIFICATION_EVENTS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as NotificationChannel)} className={inputCls}>
              {NOTIFICATION_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Recipient role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Message (placeholders like {"{name}"} shown as-is)</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={`${inputCls} py-2`} />
        </label>

        {/* Channel preview */}
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">Preview — {NOTIFICATION_CHANNELS.find((c) => c.id === channel)?.label}</p>
          <ChannelPreview channel={channel} message={message} event={event.label} />
        </div>

        <button onClick={simulate} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white hover:opacity-90">
          <Send className="h-4 w-4" /> Simulate send
        </button>
        <p className="text-center text-[11px] text-slate-400">{NOTIFICATION_DISCLAIMER}</p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Simulation history ({history.length})</h2>
        <ul className="space-y-1.5">
          {history.slice(0, 15).map((h) => (
            <li key={h.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <Pill tone="blue">{NOTIFICATION_CHANNELS.find((c) => c.id === h.channel)?.label}</Pill>
                <span className="font-medium text-slate-700">{NOTIFICATION_EVENTS.find((e) => e.id === h.eventId)?.label}</span>
                <span className="text-slate-400">→ {h.recipientRole}</span>
                <span className="ml-auto text-slate-400">{new Date(h.sentAt).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 text-slate-500">{h.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ChannelPreview({ channel, message, event }: { channel: NotificationChannel; message: string; event: string }) {
  if (channel === "sms" || channel === "messenger") {
    return (
      <div className="flex justify-start">
        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${channel === "sms" ? "rounded-bl-sm bg-slate-200 text-slate-800" : "rounded-bl-sm bg-sky-100 text-slate-800"}`}>
          {message}
          <span className="mt-1 block text-[10px] text-slate-400">{channel === "sms" ? "SMS · BIZSOLUTIONS" : "Messenger · BizSolutions Page"}</span>
        </div>
      </div>
    );
  }
  if (channel === "email") {
    return (
      <div className="rounded-xl border border-slate-200 p-3 text-sm">
        <p className="text-[11px] text-slate-400">From: notifications@bizsolutions.example · Subject: {event}</p>
        <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-700">{message}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-900 p-3 text-sm text-white">
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
      <div>
        <p className="text-xs font-semibold">{channel === "push" ? "BizSolutions" : "In-app notification"} · {event}</p>
        <p className="mt-0.5 text-xs text-slate-300">{message}</p>
      </div>
    </div>
  );
}
