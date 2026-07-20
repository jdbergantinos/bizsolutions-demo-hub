import type { ScenarioConfig, Vocab } from "../../types";
import { buildDefaultScenario } from "./builders";
import { businessName, personName, phPhone, pick, futureDate, recentDate } from "../mock/ph";

// Hand-tuned scenario overrides for flagship demos. Each starts from the
// module's default scenario and replaces fields/columns/records with
// industry-accurate ones (e.g. SKUs for retail, expiry dates for clinics).

type CustomBuilder = (vocab: Vocab, industryName: string, key: string) => ScenarioConfig;

const MECHS = ["Ramon Aquino", "Jess Villanueva", "Toto Salazar", "Nato Reyes"];
const STYLISTS = ["Cha Mendoza", "Kim Navarro", "Joy Bautista", "Mae Santos"];

export const CUSTOM_SCENARIOS: Record<string, CustomBuilder> = {
  "retail-inventory": (vocab, industryName, key) => {
    const base = buildDefaultScenario("inventory", vocab, industryName, key);
    return {
      ...base,
      title: "Retail Inventory & Stock Monitoring",
      fields: [
        { key: "name", label: "Product", type: "text", required: true },
        { key: "sku", label: "SKU", type: "text" },
        { key: "qty", label: "Stock on hand", type: "number", required: true },
        { key: "reorder", label: "Reorder level", type: "number", required: true },
        { key: "supplier", label: "Supplier", type: "text" },
        { key: "branch", label: "Branch", type: "select", options: ["Olongapo Main", "Subic Branch", "Balanga Branch"] },
      ],
      columns: [
        { key: "name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "qty", label: "On hand" },
        { key: "reorder", label: "Reorder at" },
        { key: "branch", label: "Branch" },
      ],
      records: [
        ["Sardines 155g (Sample)", "GRO-0011", 240, 100, "Olongapo Main"],
        ["Instant Coffee Twin Pack (Sample)", "GRO-0042", 18, 50, "Olongapo Main"],
        ["Laundry Detergent 1kg (Sample)", "HOM-0107", 0, 30, "Subic Branch"],
        ["Cooking Oil 1L (Sample)", "GRO-0088", 96, 40, "Balanga Branch"],
        ["School Notebook 80lvs (Sample)", "SCH-0210", 12, 60, "Subic Branch"],
        ["Bottled Water 500ml ×24 (Sample)", "BEV-0301", 75, 25, "Olongapo Main"],
      ].map(([name, sku, qty, reorder, branch], i) => ({
        values: { name, sku, qty, reorder, supplier: businessName(i + 3), branch },
        status: "in-stock",
      })),
    };
  },

  "restaurant-inventory": (vocab, industryName, key) => {
    const base = buildDefaultScenario("inventory", vocab, industryName, key);
    return {
      ...base,
      title: "Ingredient Inventory",
      fields: [
        { key: "name", label: "Ingredient", type: "text", required: true },
        { key: "unit", label: "Unit", type: "select", options: ["kg", "L", "pcs", "pack", "tray"] },
        { key: "qty", label: "Quantity", type: "number", required: true },
        { key: "reorder", label: "Reorder level", type: "number", required: true },
        { key: "supplier", label: "Supplier", type: "text" },
        { key: "location", label: "Kitchen location", type: "select", options: ["Dry storage", "Walk-in chiller", "Freezer", "Prep station"] },
      ],
      columns: [
        { key: "name", label: "Ingredient" },
        { key: "qty", label: "Qty" },
        { key: "unit", label: "Unit" },
        { key: "reorder", label: "Reorder at" },
        { key: "location", label: "Location" },
      ],
      records: [
        ["Chicken thigh fillet (Sample)", "kg", 22, 10, "Freezer"],
        ["Jasmine rice (Sample)", "kg", 8, 25, "Dry storage"],
        ["Cooking oil (Sample)", "L", 0, 12, "Dry storage"],
        ["Eggs (Sample)", "tray", 14, 6, "Walk-in chiller"],
        ["Coffee beans (Sample)", "kg", 3, 5, "Dry storage"],
        ["Fresh milk (Sample)", "L", 30, 15, "Walk-in chiller"],
      ].map(([name, unit, qty, reorder, location], i) => ({
        values: { name, unit, qty, reorder, supplier: businessName(i + 5), location },
        status: "in-stock",
      })),
    };
  },

  "automotive-inventory": (vocab, industryName, key) => {
    const base = buildDefaultScenario("inventory", vocab, industryName, key);
    return {
      ...base,
      title: "Parts Inventory",
      fields: [
        { key: "name", label: "Part", type: "text", required: true },
        { key: "partNo", label: "Part number", type: "text" },
        { key: "compat", label: "Vehicle compatibility", type: "text" },
        { key: "qty", label: "Quantity", type: "number", required: true },
        { key: "reorder", label: "Reorder level", type: "number", required: true },
        { key: "supplier", label: "Supplier", type: "text" },
      ],
      columns: [
        { key: "name", label: "Part" },
        { key: "partNo", label: "Part no." },
        { key: "compat", label: "Fits" },
        { key: "qty", label: "Qty" },
        { key: "reorder", label: "Reorder at" },
      ],
      records: [
        ["Oil filter (Sample)", "OF-1043", "Toyota Vios / Wigo", 35, 15],
        ["Brake pads front (Sample)", "BP-2210", "Mitsubishi Mirage", 6, 8],
        ["Engine oil 4L fully synthetic (Sample)", "EO-4400", "Universal", 48, 20],
        ["Fan belt (Sample)", "FB-0787", "Hyundai Accent", 0, 5],
        ["Spark plugs set (Sample)", "SP-3321", "Honda City / Civic", 12, 10],
        ["Aircon cabin filter (Sample)", "CF-5150", "Toyota Innova", 9, 6],
      ].map(([name, partNo, compat, qty, reorder], i) => ({
        values: { name, partNo, compat, qty, reorder, supplier: businessName(i + 7) },
        status: "in-stock",
      })),
    };
  },

  "construction-inventory": (vocab, industryName, key) => {
    const base = buildDefaultScenario("inventory", vocab, industryName, key);
    return {
      ...base,
      title: "Materials & Equipment Monitoring",
      fields: [
        { key: "name", label: "Material", type: "text", required: true },
        { key: "project", label: "Project", type: "select", options: ["Bataan Residence", "Subic Warehouse", "Olongapo Commercial", "Yard / stock"] },
        { key: "qty", label: "Quantity", type: "number", required: true },
        { key: "unit", label: "Unit", type: "select", options: ["bags", "pcs", "sheets", "cu.m", "lengths"] },
        { key: "issued", label: "Issued quantity", type: "number" },
        { key: "supplier", label: "Supplier", type: "text" },
      ],
      columns: [
        { key: "name", label: "Material" },
        { key: "project", label: "Project" },
        { key: "qty", label: "Qty" },
        { key: "unit", label: "Unit" },
        { key: "issued", label: "Issued" },
      ],
      reorderKey: undefined,
      records: [
        ["Portland cement (Sample)", "Bataan Residence", 120, "bags", 80],
        ["Deformed bar 10mm (Sample)", "Bataan Residence", 200, "lengths", 150],
        ["Marine plywood 3/4 (Sample)", "Subic Warehouse", 8, "sheets", 40],
        ["Washed sand (Sample)", "Olongapo Commercial", 12, "cu.m", 6],
        ["CHB 4in (Sample)", "Yard / stock", 1500, "pcs", 0],
        ["Roofing screws (Sample)", "Subic Warehouse", 0, "pcs", 500],
      ].map(([name, project, qty, unit, issued], i) => ({
        values: { name, project, qty, unit, issued, supplier: businessName(i + 9) },
        status: "in-stock",
      })),
    };
  },

  "clinic-inventory": (vocab, industryName, key) => {
    const base = buildDefaultScenario("inventory", vocab, industryName, key);
    return {
      ...base,
      title: "Clinic Supplies Inventory",
      helpText:
        "Nonclinical supplies tracking only — no medicines administration, prescriptions, or clinical decisions. All records are fictional demo data.",
      fields: [
        { key: "name", label: "Supply", type: "text", required: true },
        { key: "category", label: "Category", type: "select", options: ["Consumables", "PPE", "Office", "Instruments"] },
        { key: "qty", label: "Quantity", type: "number", required: true },
        { key: "expiry", label: "Expiration date", type: "date" },
        { key: "reorder", label: "Reorder level", type: "number", required: true },
      ],
      columns: [
        { key: "name", label: "Supply" },
        { key: "category", label: "Category" },
        { key: "qty", label: "Qty" },
        { key: "expiry", label: "Expiry" },
        { key: "reorder", label: "Reorder at" },
      ],
      records: [
        ["Examination gloves M (Sample)", "PPE", 420, futureDate(1, 300), 200],
        ["Cotton balls pack (Sample)", "Consumables", 35, futureDate(2, 400), 20],
        ["Face masks box (Sample)", "PPE", 8, futureDate(3, 200), 15],
        ["Thermal paper rolls (Sample)", "Office", 60, futureDate(4, 500), 24],
        ["Alcohol 70% 1L (Sample)", "Consumables", 0, futureDate(5, 250), 12],
        ["Sterile gauze pads (Sample)", "Consumables", 90, futureDate(6, 350), 40],
      ].map(([name, category, qty, expiry, reorder]) => ({
        values: { name, category, qty, expiry, reorder },
        status: "in-stock",
      })),
    };
  },

  "realestate-crm": (vocab, industryName, key) => {
    const base = buildDefaultScenario("crm", vocab, industryName, key);
    return {
      ...base,
      title: "Real Estate Lead CRM",
      fields: [
        { key: "name", label: "Buyer name", type: "text", required: true },
        { key: "phone", label: "Mobile number", type: "text" },
        { key: "interest", label: "Property interest", type: "select", options: ["House & lot", "Condo unit", "Lot only", "Rental", "Commercial"] },
        { key: "budget", label: "Budget range", type: "select", options: ["Below ₱1M", "₱1M–₱3M", "₱3M–₱6M", "₱6M–₱10M", "Above ₱10M"] },
        { key: "source", label: "Lead source", type: "select", options: ["Facebook", "Referral", "Tripping", "Website", "Open house"] },
        { key: "location", label: "Preferred location", type: "text" },
      ],
      columns: [
        { key: "name", label: "Buyer" },
        { key: "interest", label: "Interest" },
        { key: "budget", label: "Budget" },
        { key: "source", label: "Source" },
      ],
      records: Array.from({ length: 7 }, (_, i) => ({
        values: {
          name: personName(i + 140),
          phone: phPhone(i + 9),
          interest: pick(["House & lot", "Condo unit", "Lot only", "Rental", "Commercial"], i),
          budget: pick(["Below ₱1M", "₱1M–₱3M", "₱3M–₱6M", "₱6M–₱10M"], i),
          source: pick(["Facebook", "Referral", "Tripping", "Website", "Open house"], i),
          location: pick(["Olongapo", "Subic", "Castillejos", "Dinalupihan", "San Fernando"], i),
        },
        status: base.statuses[i % (base.statuses.length - 1)].id,
        assignee: pick(base.assigneeOptions, i),
      })),
    };
  },

  "clinic-booking": (vocab, industryName, key) => {
    const base = buildDefaultScenario("booking", vocab, industryName, key);
    return {
      ...base,
      title: "Clinic Appointment Booking",
      helpText:
        "Appointment scheduling only — no medical records, diagnosis, or treatment functions. All records are fictional demo data.",
      fields: [
        { key: "name", label: "Patient name", type: "text", required: true },
        { key: "service", label: "Service", type: "select", options: ["Consultation", "Dental cleaning", "Eye check-up", "Therapy session", "Follow-up visit"] },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "time", label: "Time", type: "time" },
        { key: "phone", label: "Mobile number", type: "text" },
        { key: "notes", label: "Notes (nonclinical)", type: "textarea" },
      ],
      records: base.records.map((r, i) => ({
        ...r,
        values: {
          ...r.values,
          service: pick(["Consultation", "Dental cleaning", "Eye check-up", "Therapy session", "Follow-up visit"], i),
        },
      })),
    };
  },

  "salon-booking": (vocab, industryName, key) => {
    const base = buildDefaultScenario("booking", vocab, industryName, key);
    return {
      ...base,
      title: "Salon Online Booking",
      assigneeLabel: "Stylist",
      assigneeOptions: STYLISTS,
      fields: [
        { key: "name", label: "Client name", type: "text", required: true },
        { key: "service", label: "Service", type: "select", options: ["Haircut", "Hair color", "Rebond", "Manicure & pedicure", "Full spa massage"] },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "time", label: "Time", type: "time" },
        { key: "phone", label: "Mobile number", type: "text" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      records: base.records.map((r, i) => ({
        ...r,
        assignee: pick(STYLISTS, i),
        values: {
          ...r.values,
          service: pick(["Haircut", "Hair color", "Rebond", "Manicure & pedicure", "Full spa massage"], i),
        },
      })),
    };
  },

  "auto-joborder": (vocab, industryName, key) => {
    const base = buildDefaultScenario("projects", vocab, industryName, key);
    return {
      ...base,
      title: "Job-Order Management",
      recordName: "Job Order",
      recordNamePlural: "Job Orders",
      assigneeLabel: "Mechanic",
      assigneeOptions: MECHS,
      fields: [
        { key: "name", label: "Job order no.", type: "text", required: true },
        { key: "client", label: "Customer", type: "text", required: true },
        { key: "vehicle", label: "Vehicle", type: "text", placeholder: "e.g. Toyota Vios 2019" },
        { key: "plate", label: "Plate no.", type: "text" },
        { key: "concern", label: "Customer concern", type: "textarea" },
        { key: "due", label: "Promised date", type: "date" },
      ],
      columns: [
        { key: "name", label: "JO no." },
        { key: "client", label: "Customer" },
        { key: "vehicle", label: "Vehicle" },
        { key: "due", label: "Promised" },
      ],
      records: [
        ["JO-1041", "Toyota Vios 2019", "NDA 3921", "Aircon not cooling; check compressor."],
        ["JO-1042", "Mitsubishi Mirage 2021", "CAX 1055", "Change oil and general check-up."],
        ["JO-1043", "Honda City 2018", "NBC 7738", "Brake noise when stopping."],
        ["JO-1044", "Toyota Innova 2020", "DAL 4460", "Preventive maintenance service 40k km."],
        ["JO-1045", "Hyundai Accent 2017", "AAV 2019", "Overheating reported; pressure test."],
        ["JO-1046", "Suzuki Ertiga 2022", "NFC 8812", "Detailing package — full interior."],
      ].map(([jo, vehicle, plate, concern], i) => ({
        values: {
          name: `${jo} (Sample)`,
          client: personName(i + 150),
          vehicle,
          plate,
          concern,
          due: futureDate(i, 7),
          start: recentDate(i, 5),
        },
        status: base.statuses[i % (base.statuses.length - 1)].id,
        assignee: pick(MECHS, i),
      })),
    };
  },
};
