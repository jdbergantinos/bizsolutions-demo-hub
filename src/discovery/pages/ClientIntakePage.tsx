import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Lock, Send } from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { useToast } from "../../store/ToastContext";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { loadPricingSettings } from "../../pricing/store/pricingStorage";
import type { SelectedProblem } from "../types";
import { BUDGET_RANGES, IMPLEMENTATION_PERIODS, OUTCOME_OPTIONS, TOOL_OPTIONS } from "../config/discoveryOptions";
import { PROBLEM_CATALOG, PROBLEM_CATEGORIES } from "../config/problemCatalog";
import { newDiscovery, setActiveDiscoveryId, upsertDiscovery } from "../store/discoveryStorage";

// Client-facing intake form. Rendered OUTSIDE the app layout (like the guided
// presentation) so the client sees no navigation and cannot reach pricing,
// other clients, or settings. Exiting requires the presenter's pricing PIN.

interface IntakeForm {
  businessName: string;
  contactPerson: string;
  industryId: string;
  businessExample: string;
  location: string;
  branches: number;
  employees: string;
  tools: string[];
  fieldStaff: boolean | null;
  customerPortalExpected: boolean | null;
  problemIds: string[];
  outcomes: string[];
  implementationPeriod: string;
  budgetRange: string;
  notes: string;
}

const inputCls =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function ClientIntakePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const settings = useMemo(loadPricingSettings, []);
  const allowExitRef = useRef(false);

  const [form, setForm] = useState<IntakeForm>(() => ({
    businessName: "",
    contactPerson: "",
    industryId: params.get("industry") ?? "",
    businessExample: "",
    location: "",
    branches: 1,
    employees: "",
    tools: [],
    fieldStaff: null,
    customerPortalExpected: null,
    problemIds: [],
    outcomes: [],
    implementationPeriod: "",
    budgetRange: "",
    notes: "",
  }));
  const [submitted, setSubmitted] = useState(false);
  const [exitPinOpen, setExitPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);

  const set = (patch: Partial<IntakeForm>) => setForm((f) => ({ ...f, ...patch }));
  const industry = getIndustry(form.industryId);

  // Best-effort lock: re-trap in-app back navigation, and warn on refresh
  // while the client has entered something. Not hardened security — the real
  // safeguard is the presenter staying nearby.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      if (allowExitRef.current) return;
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!submitted && (form.businessName || form.problemIds.length)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitted, form.businessName, form.problemIds.length]);

  // Functional update so rapid successive taps each build on the latest
  // selection rather than a stale snapshot of the list.
  const toggle = (key: "tools" | "outcomes" | "problemIds", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value],
    }));

  const submit = () => {
    if (!form.businessName.trim()) {
      toast("Please enter your business name.", "info");
      return;
    }
    const now = new Date().toISOString();
    const d = newDiscovery();
    d.status = "in-progress";
    d.business = {
      ...d.business,
      businessName: form.businessName.trim(),
      contactPerson: form.contactPerson.trim(),
      industryId: form.industryId,
      businessExample: form.businessExample,
      location: form.location.trim(),
      branches: Math.max(1, form.branches),
      employees: form.employees,
      implementationPeriod: form.implementationPeriod,
      budgetRange: form.budgetRange,
      notes: form.notes.trim(),
    };
    d.operations = {
      ...d.operations,
      tools: form.tools,
      // 2+ branches means multi-branch — derived, not asked again.
      multiBranch: form.branches >= 2,
      fieldStaff: form.fieldStaff === true,
      customerPortalExpected: form.customerPortalExpected === true,
    };
    d.desiredOutcomes = form.outcomes;
    d.problems = form.problemIds.map(
      (id): SelectedProblem => ({ problemId: id, severity: "moderate", priority: "medium", note: "", verification: "verified" }),
    );
    // Marker so the presenter can see this discovery came from the client.
    d.presenterNotes = `[Submitted by the client via the intake form on ${now.slice(0, 10)}]`;
    upsertDiscovery(d);
    setActiveDiscoveryId(d.id);
    setSubmitted(true);
  };

  const attemptExit = () => {
    if (settings.internalPin) {
      setPinValue("");
      setExitPinOpen(true);
    } else {
      setConfirmExit(true);
    }
  };

  const doExit = () => {
    allowExitRef.current = true;
    navigate("/discovery");
  };

  // ---- Thank-you screen ----
  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Thank you!</h1>
        <p className="mt-2 max-w-sm text-base text-slate-600">
          Your details have been received. Please hand the device back so we can show you the right solution.
        </p>
        <button
          onClick={attemptExit}
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-xs font-medium text-slate-500 hover:bg-white"
        >
          <Lock className="h-3.5 w-3.5" /> Presenter: return to app
        </button>
        {exitPinOpen && <ExitPin pin={settings.internalPin} value={pinValue} onChange={setPinValue} onClose={() => setExitPinOpen(false)} onUnlock={doExit} toast={toast} />}
        {confirmExit && (
          <ConfirmDialog
            title="Return to the presenter app?"
            message="Set an internal PIN in Pricing Admin to lock this exit in future sessions."
            confirmLabel="Return"
            destructive={false}
            onConfirm={doExit}
            onCancel={() => setConfirmExit(false)}
          />
        )}
      </div>
    );
  }

  // ---- The form ----
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Tell us about your business</p>
            <p className="text-[11px] text-slate-400">A few quick questions so we can tailor what we show you.</p>
          </div>
          <button
            onClick={attemptExit}
            aria-label="Presenter exit"
            title="Presenter exit"
            className="rounded-lg border border-slate-200 p-2 text-slate-300 hover:text-slate-500"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <Section title="Your business">
          <Field label="Business name" required>
            <input value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="e.g. Bella Salon & Spa" className={inputCls} />
          </Field>
          <Field label="Your name">
            <input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} placeholder="e.g. Maria Santos" className={inputCls} />
          </Field>
          <Field label="Industry">
            <select value={form.industryId} onChange={(e) => set({ industryId: e.target.value, businessExample: "" })} className={inputCls}>
              <option value="">— Select —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          {industry && (
            <Field label="What best describes you?">
              <select value={form.businessExample} onChange={(e) => set({ businessExample: e.target.value })} className={inputCls}>
                <option value="">— Select —</option>
                {industry.examples.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Location">
              <input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Olongapo" className={inputCls} />
            </Field>
            <Field label="Branches">
              <input type="number" min={1} value={form.branches} onChange={(e) => set({ branches: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
            </Field>
            <Field label="Employees">
              <input type="number" min={0} value={form.employees} onChange={(e) => set({ employees: e.target.value })} placeholder="e.g. 8" className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="What do you use today?">
          {/* "Other" is dropped for the client form — anything unusual goes in Notes. */}
          <ChipGroup options={TOOL_OPTIONS.filter((o) => o !== "Other")} selected={form.tools} onToggle={(v) => toggle("tools", v)} />
        </Section>

        <Section title="How you operate">
          <div className="space-y-4">
            <YesNo label="Do any of your staff work out in the field (deliveries, on-site jobs)?" value={form.fieldStaff} onChange={(v) => set({ fieldStaff: v })} />
            <YesNo label="Would your customers use an app to book or check status?" value={form.customerPortalExpected} onChange={(v) => set({ customerPortalExpected: v })} />
          </div>
        </Section>

        <Section title="What are your biggest headaches?" hint="Tap all that feel familiar.">
          <div className="space-y-3">
            {PROBLEM_CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROBLEM_CATALOG.filter((p) => p.category === cat).map((p) => {
                    const on = form.problemIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle("problemIds", p.id)}
                        aria-pressed={on}
                        className={`min-h-11 rounded-xl px-3 text-sm font-medium ${on ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                      >
                        {p.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What would you love to improve?">
          <ChipGroup options={OUTCOME_OPTIONS.filter((o) => o !== "Other")} selected={form.outcomes} onToggle={(v) => toggle("outcomes", v)} />
        </Section>

        <Section title="Anything else? (optional)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="When are you hoping to start?">
              <select value={form.implementationPeriod} onChange={(e) => set({ implementationPeriod: e.target.value })} className={inputCls}>
                <option value="">— Not sure yet —</option>
                {IMPLEMENTATION_PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Budget you have in mind">
              <select value={form.budgetRange} onChange={(e) => set({ budgetRange: e.target.value })} className={inputCls}>
                <option value="">— Prefer not to say —</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} placeholder="e.g. We'd like to start with one branch" className={`${inputCls} py-2`} />
          </Field>
        </Section>

        <button
          onClick={submit}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-white hover:opacity-90"
        >
          <Send className="h-5 w-5" /> Submit
        </button>
        <p className="pb-4 text-center text-[11px] text-slate-400">
          Your answers stay on this device and are shared only with the person presenting to you.
        </p>
      </main>

      {exitPinOpen && <ExitPin pin={settings.internalPin} value={pinValue} onChange={setPinValue} onClose={() => setExitPinOpen(false)} onUnlock={doExit} toast={toast} />}
      {confirmExit && (
        <ConfirmDialog
          title="Return to the presenter app?"
          message="This leaves the client intake form. Set an internal PIN in Pricing Admin to lock this exit in future sessions."
          confirmLabel="Return"
          destructive={false}
          onConfirm={doExit}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </div>
  );
}

function ExitPin({
  pin,
  value,
  onChange,
  onClose,
  onUnlock,
  toast,
}: {
  pin: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onUnlock: () => void;
  toast: (m: string, k?: "success" | "info") => void;
}) {
  return (
    <Modal title="Presenter PIN" onClose={onClose}>
      <p className="mb-3 text-xs text-slate-500">Enter your pricing PIN to return to the app.</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter PIN"
        className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
      />
      <button
        onClick={() => {
          if (value === pin) onUnlock();
          else toast("Incorrect PIN.", "info");
        }}
        className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white"
      >
        Unlock & return
      </button>
    </Modal>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>
        <div className="space-y-3">{children}</div>
      </div>
    </section>
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

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          aria-pressed={value === true}
          className={`min-h-11 flex-1 rounded-xl text-sm font-medium ${value === true ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          aria-pressed={value === false}
          className={`min-h-11 flex-1 rounded-xl text-sm font-medium ${value === false ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function ChipGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            aria-pressed={on}
            className={`min-h-11 rounded-xl px-3 text-sm font-medium ${on ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
