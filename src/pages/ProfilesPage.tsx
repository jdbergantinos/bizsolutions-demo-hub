import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, CheckCircle2, Copy, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { ClientProfile } from "../types";
import { INDUSTRIES, getIndustry } from "../data/catalog";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { uid } from "../utils/storage";

const ACCENTS = ["#0f4c81", "#0e7490", "#15803d", "#b45309", "#be185d", "#6d28d9"];

const emptyProfile = (): ClientProfile => ({
  id: uid(),
  businessName: "",
  contactPerson: "",
  industryId: "",
  businessType: "",
  branches: "",
  employees: "",
  currentSystems: "",
  primaryProblems: "",
  desiredOutcomes: "",
  notes: "",
  accentColor: ACCENTS[0],
  createdAt: new Date().toISOString(),
});

export function ProfilesPage() {
  const { profiles, activeProfileId, setActiveProfile, saveProfile, deleteProfile, duplicateProfile } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<ClientProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClientProfile | null>(null);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Client Profiles</h1>
          <p className="text-sm text-slate-500">Stored only on this device. Use for meeting personalization.</p>
        </div>
        <button
          onClick={() => setEditing(emptyProfile())}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </header>

      {profiles.length === 0 ? (
        <EmptyState
          icon="UserRound"
          title="No client profiles yet"
          message="Create a profile before a meeting to personalize demos, the accent color, and the solution summary."
        />
      ) : (
        <ul className="space-y-2">
          {profiles.map((p) => {
            const active = p.id === activeProfileId;
            return (
              <li
                key={p.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${active ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}
              >
                <div className="flex items-start gap-3">
                  {p.logo ? (
                    <img src={p.logo} alt="" className="h-11 w-11 rounded-xl border border-slate-200 object-cover" />
                  ) : (
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: p.accentColor ?? "#0f4c81" }}
                    >
                      <UserRound className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{p.businessName || "Unnamed business"}</p>
                    <p className="text-xs text-slate-500">
                      {[p.contactPerson, getIndustry(p.industryId)?.name, p.branches && `${p.branches} branch(es)`]
                        .filter(Boolean)
                        .join(" · ") || "No details yet"}
                    </p>
                    {active && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active profile
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveProfile(active ? null : p.id);
                      toast(active ? "Profile deselected." : `"${p.businessName}" is now the active client.`);
                    }}
                    className={`min-h-10 flex-1 rounded-lg text-xs font-semibold ${
                      active
                        ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
                        : "bg-accent text-white hover:opacity-90"
                    }`}
                  >
                    {active ? "Deselect" : "Set active"}
                  </button>
                  <IconBtn label="Create estimate for this client" onClick={() => navigate(`/pricing/new?client=${p.id}`)}>
                    <Calculator className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Edit" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Duplicate"
                    onClick={() => {
                      duplicateProfile(p.id);
                      toast("Profile duplicated.");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Delete" danger onClick={() => setConfirmDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ProfileForm
          profile={editing}
          isNew={!profiles.some((x) => x.id === editing.id)}
          onSave={(p) => {
            saveProfile(p);
            setEditing(null);
            toast("Client profile saved.");
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this profile?"
          message={`"${confirmDelete.businessName || "Unnamed business"}" and its temporary logo will be removed from this device.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteProfile(confirmDelete.id);
            setConfirmDelete(null);
            toast("Profile deleted.");
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileForm({
  profile,
  isNew,
  onSave,
  onClose,
}: {
  profile: ClientProfile;
  isNew: boolean;
  onSave: (p: ClientProfile) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState(profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ClientProfile>) => setP((x) => ({ ...x, ...patch }));

  const inputCls =
    "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <Modal title={isNew ? "New Client Profile" : "Edit Client Profile"} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(p);
        }}
        className="space-y-3"
      >
        <Field label="Business name" required>
          <input required value={p.businessName} onChange={(e) => set({ businessName: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person">
            <input value={p.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Business type">
            <input value={p.businessType} onChange={(e) => set({ businessType: e.target.value })} placeholder="e.g. multi-branch retail" className={inputCls} />
          </Field>
        </div>
        <Field label="Industry">
          <select value={p.industryId} onChange={(e) => set({ industryId: e.target.value })} className={inputCls}>
            <option value="">— Select industry —</option>
            {INDUSTRIES.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Number of branches">
            <input type="number" min={0} value={p.branches} onChange={(e) => set({ branches: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Number of employees">
            <input type="number" min={0} value={p.employees} onChange={(e) => set({ employees: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Current systems">
          <input value={p.currentSystems} onChange={(e) => set({ currentSystems: e.target.value })} placeholder="e.g. notebooks, Excel, Messenger" className={inputCls} />
        </Field>
        <Field label="Primary problems">
          <textarea value={p.primaryProblems} onChange={(e) => set({ primaryProblems: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </Field>
        <Field label="Desired outcomes">
          <textarea value={p.desiredOutcomes} onChange={(e) => set({ desiredOutcomes: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </Field>
        <Field label="Notes">
          <textarea value={p.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </Field>

        <Field label="Temporary logo (stored only on this device)">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt="Logo preview" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" />}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => onLogoFile(e.target.files?.[0])}
              className="text-xs"
            />
            {p.logo && (
              <button
                type="button"
                onClick={() => {
                  set({ logo: undefined });
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </Field>

        <Field label="Accent color">
          <div className="flex items-center gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                onClick={() => set({ accentColor: c })}
                className={`h-9 w-9 rounded-full border-2 ${p.accentColor === c ? "border-slate-900" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={p.accentColor ?? "#0f4c81"}
              onChange={(e) => set({ accentColor: e.target.value })}
              aria-label="Custom accent color"
              className="h-9 w-9 cursor-pointer rounded-full border border-slate-300"
            />
          </div>
        </Field>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90">
            Save profile
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
