import { useState } from "react";
import type { FieldDef } from "../../types";
import { Modal } from "../common/Modal";
import { placeholderFor } from "../../utils/samplePlaceholders";

/** Renders a scenario's configured fields as a create/edit form. */
export function RecordForm({
  title,
  fields,
  initial,
  onSubmit,
  onClose,
  submitLabel = "Save",
}: {
  title: string;
  fields: FieldDef[];
  initial?: Record<string, string | number>;
  onSubmit: (values: Record<string, string | number>) => void;
  onClose: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const v: Record<string, string | number> = {};
    for (const f of fields) v[f.key] = initial?.[f.key] ?? "";
    return v;
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: string | number) => setValues((v) => ({ ...v, [key]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && String(values[f.key]).trim() === "");
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    onSubmit(values);
  };

  const inputCls =
    "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </span>
            {f.type === "select" ? (
              <select
                value={String(values[f.key])}
                onChange={(e) => set(f.key, e.target.value)}
                className={inputCls}
              >
                <option value="">— Select —</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={String(values[f.key])}
                onChange={(e) => set(f.key, e.target.value)}
                rows={3}
                placeholder={placeholderFor(f)}
                className={`${inputCls} min-h-20 py-2`}
              />
            ) : (
              <input
                type={f.type === "currency" ? "number" : f.type}
                value={String(values[f.key])}
                onChange={(e) =>
                  set(
                    f.key,
                    f.type === "number" || f.type === "currency"
                      ? e.target.value === "" ? "" : Number(e.target.value)
                      : e.target.value,
                  )
                }
                placeholder={placeholderFor(f)}
                className={inputCls}
              />
            )}
          </label>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
