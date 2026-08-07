import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { landedCost, maximumOffer, projectedGrossProfit, projectedMarginPercent } from "../domain/calculations";

type IconName =
  | "grid" | "acquisition" | "car" | "wrench" | "users" | "document" | "bank" | "card" | "user" | "chart" | "shield"
  | "settings" | "building" | "calendar" | "bell" | "chevronDown" | "search" | "plus" | "arrowUp" | "arrowDown" | "database"
  | "ticket" | "clock" | "alert" | "check" | "filter" | "more" | "arrowRight" | "phone" | "message" | "external" | "download"
  | "play" | "receipt" | "link" | "logout" | "eye" | "refresh" | "target" | "briefcase" | "menu" | "close" | "key" | "truck" | "wallet" | "tag";

type PageKey = "overview" | "acquisition" | "inventory" | "reconditioning" | "leads" | "deals" | "finance" | "reports" | "settings" | "attention";
type Tone = "positive" | "warning" | "critical" | "info" | "neutral";

type Vehicle = {
  id: string;
  stock: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  mileage: string;
  branch: string;
  status: string;
  age: number;
  landedCost: number;
  price: number;
  margin: number;
  reconStatus: string;
  location: string;
  thumbnail: string;
};

type Lead = {
  id: string;
  name: string;
  source: string;
  vehicle: string;
  branch: string;
  owner: string;
  status: string;
  age: string;
  nextAction: string;
  priority: Tone;
};

type ReconJob = {
  id: string;
  stock: string;
  vehicle: string;
  branch: string;
  category: string;
  supplier: string;
  status: string;
  due: string;
  budget: number;
  actual: number;
};

type Payment = {
  id: string;
  reference: string;
  customer: string;
  vehicle: string;
  amount: number;
  method: string;
  status: string;
  date: string;
};

type Activity = { id: string; title: string; detail: string; time: string; tone: Tone };

type DemoState = {
  portfolio: { stockOnHand: number; capitalInStock: number; unitsSold: number; grossProfit: number; avgStockAge: number; newLeads: number };
  salesTrend: number[];
  profitTrend: number[];
  vehicles: Vehicle[];
  leads: Lead[];
  reconJobs: ReconJob[];
  payments: Payment[];
  activities: Activity[];
};

const STORAGE_KEY = "motoros-demo-state-v1";
const ZAR_FORMATTER = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const NUMBER_FORMATTER = new Intl.NumberFormat("en-ZA");

const navGroups: { label: string; items: { key: PageKey; label: string; icon: IconName }[] }[] = [
  { label: "Workspace", items: [{ key: "overview", label: "Overview", icon: "grid" }, { key: "acquisition", label: "Acquisition", icon: "acquisition" }, { key: "inventory", label: "Inventory", icon: "car" }, { key: "reconditioning", label: "Reconditioning", icon: "wrench" }, { key: "leads", label: "Leads", icon: "users" }, { key: "deals", label: "Deals", icon: "document" }] },
  { label: "Control", items: [{ key: "finance", label: "Finance", icon: "wallet" }, { key: "reports", label: "Reports", icon: "chart" }, { key: "settings", label: "Settings", icon: "settings" }] },
];

const reportDefinitions: { title: string; description: string; icon: IconName; updated: string }[] = [
  { title: "Stock valuation and ageing", description: "Landed cost, retail value, age buckets, and margin by branch.", icon: "car", updated: "Updated 5 min ago" },
  { title: "Acquisition performance", description: "Source conversion, buyer activity, offers, and purchase yield.", icon: "acquisition", updated: "Updated today" },
  { title: "Recon spend and turnaround", description: "Budget variance, suppliers, blockers, and retail-ready cycle time.", icon: "wrench", updated: "Updated 1h ago" },
  { title: "Lead funnel and conversion", description: "First-response time, appointments, test drives, and lost reasons.", icon: "users", updated: "Updated 5 min ago" },
  { title: "Gross profit by branch", description: "Projected vs realised gross by vehicle, model, and salesperson.", icon: "chart", updated: "Updated yesterday" },
  { title: "Payments and reconciliation", description: "Received, allocated, unmatched, refunds, and closeout exceptions.", icon: "wallet", updated: "Updated 5 min ago" },
];

const iconPaths: Record<IconName, string[]> = {
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  acquisition: ["M3 5h18", "M5 5v14", "M19 5v14", "M8 9h8", "M8 13h6", "M8 17h4"],
  car: ["M5 17h14l1-5-2-5H6l-2 5z", "M7 7l1.5-3h7L17 7", "M7 17v2", "M17 17v2", "M7 12h.01", "M17 12h.01"],
  wrench: ["M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-2-2z"],
  users: ["M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 20v-2a4 4 0 0 0-3-3.87", "M16 2.13a4 4 0 0 1 0 7.75"],
  document: ["M6 2h9l3 3v17H6z", "M15 2v4h4", "M9 12h6", "M9 16h6"],
  bank: ["M3 10h18", "M5 10v8", "M9 10v8", "M15 10v8", "M19 10v8", "M3 20h18", "M12 3l9 5H3z"],
  card: ["M3 6h18v12H3z", "M3 10h18", "M7 15h4"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  chart: ["M4 19V5", "M4 19h17", "M8 15l3-4 3 2 5-7"],
  shield: ["M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z", "M9 12l2 2 4-4"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M3 12h2", "M19 12h2", "M12 3v2", "M12 19v2", "M5.6 5.6l1.4 1.4", "M17 17l1.4 1.4", "M18.4 5.6L17 7", "M7 17l-1.4 1.4"],
  building: ["M4 21V4h10v17", "M14 9h6v12", "M7 8h3", "M7 12h3", "M7 16h3", "M17 13h1", "M17 17h1"],
  calendar: ["M4 5h16v15H4z", "M8 3v4", "M16 3v4", "M4 10h16"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  chevronDown: ["M6 9l6 6 6-6"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  plus: ["M12 5v14", "M5 12h14"],
  arrowUp: ["M12 19V5", "M6 11l6-6 6 6"],
  arrowDown: ["M12 5v14", "M18 13l-6 6-6-6"],
  database: ["M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3z", "M4 6v6c0 2 3.6 3 8 3s8-1 8-3V6", "M4 12v6c0 2 3.6 3 8 3s8-1 8-3v-6"],
  ticket: ["M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4z", "M12 8v8"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  alert: ["M12 3l9 17H3z", "M12 9v4", "M12 17h.01"],
  check: ["M5 12l4 4L19 6"],
  filter: ["M4 6h16", "M7 12h10", "M10 18h4"],
  more: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
  arrowRight: ["M5 12h14", "M13 6l6 6-6 6"],
  phone: ["M5 4h3l2 5-2 1a13 13 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2z"],
  message: ["M4 5h16v11H8l-4 4z", "M8 9h8", "M8 12h5"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 13v6H4V5h6"],
  download: ["M12 3v12", "M7 10l5 5 5-5", "M4 21h16"],
  play: ["M8 5l9 7-9 7z"],
  receipt: ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9 8h6", "M9 12h6", "M9 16h4"],
  link: ["M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1", "M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"],
  logout: ["M10 17l5-5-5-5", "M15 12H3", "M21 19V5a2 2 0 0 0-2-2h-5"],
  eye: ["M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  refresh: ["M20 11a8.1 8.1 0 0 0-14-4L3 10", "M3 5v5h5", "M4 13a8.1 8.1 0 0 0 14 4l3-3", "M21 19v-5h-5"],
  target: ["M12 3v3", "M12 18v3", "M3 12h3", "M18 12h3", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  briefcase: ["M4 7h16v12H4z", "M9 7V5h6v2", "M4 12h16", "M10 12v2h4v-2"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  key: ["M14 7a4 4 0 1 0-1 7l6 6 2-2-2-2 2-2-4-4a4 4 0 0 0-3-3z"],
  truck: ["M3 6h11v10H3z", "M14 10h4l3 3v3h-7z", "M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  wallet: ["M3 6h18v13H3z", "M3 6l2-3h14l2 3", "M16 12h5", "M17 12h.01"],
  tag: ["M4 4h7l9 9-7 7-9-9z", "M8 8h.01"],
};

function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{iconPaths[name].map((path) => <path key={path} d={path} />)}</svg>;
}

function seedState(): DemoState {
  return {
    portfolio: { stockOnHand: 1248, capitalInStock: 186_400_000, unitsSold: 612, grossProfit: 14_800_000, avgStockAge: 38, newLeads: 86 },
    salesTrend: [352, 448, 501, 578, 541, 620],
    profitTrend: [8.7, 11.9, 13.8, 15.2, 14.6, 16.9],
    vehicles: [
      { id: "v-01", stock: "MOS-240116", registration: "CAA123GP", make: "Toyota", model: "Hilux 2.4 GD-6 SRX", year: 2021, mileage: "68,420 km", branch: "Midrand", status: "Inspection", age: 12, landedCost: 486_250, price: 619_900, margin: 18.1, reconStatus: "Blocked", location: "Inspection bay 04", thumbnail: "Hilux" },
      { id: "v-02", stock: "MOS-240108", registration: "CAA456GP", make: "Volkswagen", model: "Polo Vivo 1.4 Trendline", year: 2020, mileage: "74,120 km", branch: "Centurion", status: "Recon", age: 41, landedCost: 164_900, price: 219_900, margin: 14.2, reconStatus: "In progress", location: "Workshop · Job 164", thumbnail: "Polo" },
      { id: "v-03", stock: "MOS-240102", registration: "CAA789GP", make: "Ford", model: "Ranger 2.2 XLS", year: 2022, mileage: "49,680 km", branch: "Johannesburg", status: "Retail ready", age: 32, landedCost: 398_600, price: 499_900, margin: 16.7, reconStatus: "Passed", location: "Display row B12", thumbnail: "Ranger" },
      { id: "v-04", stock: "MOS-239944", registration: "CAA135GP", make: "BMW", model: "320i Sport (F30)", year: 2019, mileage: "91,220 km", branch: "Midrand", status: "Retail ready", age: 123, landedCost: 281_000, price: 349_900, margin: 9.8, reconStatus: "Passed", location: "Display row A07", thumbnail: "BMW" },
      { id: "v-05", stock: "MOS-240121", registration: "CAA246GP", make: "Audi", model: "A4 1.4T FSI", year: 2020, mileage: "83,550 km", branch: "Cape Town", status: "Transfer", age: 118, landedCost: 296_400, price: 379_900, margin: 11.4, reconStatus: "Passed", location: "In transit · CT-004", thumbnail: "Audi" },
      { id: "v-06", stock: "MOS-240127", registration: "CAA357GP", make: "Hyundai", model: "Tucson 2.0 Premium", year: 2022, mileage: "55,300 km", branch: "Johannesburg", status: "Reserved", age: 112, landedCost: 319_800, price: 429_900, margin: 13.6, reconStatus: "Passed", location: "Reserved · Deal D-441", thumbnail: "Tucson" },
      { id: "v-07", stock: "MOS-240130", registration: "CAA468GP", make: "Isuzu", model: "D-Max 3.0 LX", year: 2023, mileage: "31,850 km", branch: "Centurion", status: "Acquired", age: 8, landedCost: 512_000, price: 649_900, margin: 17.4, reconStatus: "Not started", location: "Check-in yard 03", thumbnail: "D-Max" },
      { id: "v-08", stock: "MOS-239901", registration: "CAA579GP", make: "Mercedes-Benz", model: "C200 AMG Line", year: 2021, mileage: "61,400 km", branch: "Midrand", status: "Sold", age: 54, landedCost: 442_000, price: 579_900, margin: 15.5, reconStatus: "Passed", location: "Delivery hold", thumbnail: "C200" },
    ],
    leads: [
      { id: "L-1042", name: "Kabelo Mokoena", source: "Online valuation", vehicle: "2021 Toyota Fortuner", branch: "Midrand", owner: "Lerato M.", status: "Inspection", age: "18 min", nextAction: "Complete inspection", priority: "info" },
      { id: "L-1038", name: "Sipho Dlamini", source: "Website form", vehicle: "Ford Ranger 2.2 XLS", branch: "Johannesburg", owner: "Thabo M.", status: "Test drive booked", age: "2h", nextAction: "Confirm appointment", priority: "positive" },
      { id: "L-1034", name: "Jason Naidoo", source: "WhatsApp", vehicle: "VW Polo Vivo", branch: "Centurion", owner: "Lerato M.", status: "New", age: "1d", nextAction: "First response overdue", priority: "critical" },
      { id: "L-1029", name: "Zanele Khumalo", source: "Referral", vehicle: "Audi A4 1.4T", branch: "Cape Town", owner: "Mpho K.", status: "Offer sent", age: "2d", nextAction: "Follow up offer", priority: "warning" },
      { id: "L-1025", name: "Liam van der Merwe", source: "Marketplace", vehicle: "Hyundai Tucson", branch: "Johannesburg", owner: "Thabo M.", status: "Qualified", age: "3d", nextAction: "Schedule test drive", priority: "info" },
    ],
    reconJobs: [
      { id: "RJ-2408", stock: "MOS-240108", vehicle: "2020 Volkswagen Polo Vivo", branch: "Centurion", category: "Body & paint", supplier: "AutoFix Midrand", status: "Overdue", due: "20 May 2025", budget: 12_500, actual: 14_200 },
      { id: "RJ-2407", stock: "MOS-240116", vehicle: "2021 Toyota Hilux", branch: "Midrand", category: "Inspection defects", supplier: "Internal workshop", status: "Awaiting approval", due: "22 May 2025", budget: 18_750, actual: 0 },
      { id: "RJ-2403", stock: "MOS-240102", vehicle: "2022 Ford Ranger", branch: "Johannesburg", category: "Retail preparation", supplier: "Internal workshop", status: "Complete", due: "18 May 2025", budget: 9_800, actual: 9_350 },
      { id: "RJ-2398", stock: "MOS-240121", vehicle: "2020 Audi A4", branch: "Cape Town", category: "Tyres & alignment", supplier: "TyrePro Cape Town", status: "In progress", due: "24 May 2025", budget: 8_400, actual: 6_100 },
    ],
    payments: [
      { id: "P-10032", reference: "DPS10032", customer: "Sipho Dlamini", vehicle: "Ford Ranger 2.2 XLS", amount: 25_000, method: "EFT", status: "Awaiting verification", date: "20 May 2025 · 08:54" },
      { id: "P-10031", reference: "DPS10031", customer: "Lerato Mokoena", vehicle: "VW Polo Vivo", amount: 15_000, method: "Card", status: "Received", date: "20 May 2025 · 08:41" },
      { id: "P-10029", reference: "DPS10029", customer: "Jason Naidoo", vehicle: "Hyundai Tucson", amount: 30_000, method: "EFT", status: "Unreconciled", date: "19 May 2025 · 16:18" },
      { id: "P-10024", reference: "DPS10024", customer: "Zanele Khumalo", vehicle: "Audi A4 1.4T", amount: 10_000, method: "EFT", status: "Allocated", date: "19 May 2025 · 13:02" },
    ],
    activities: [
      { id: "a-1", title: "New acquisition captured", detail: "Isuzu D-Max · MOS-240130", time: "12 min ago", tone: "info" },
      { id: "a-2", title: "Offer approval requested", detail: "Toyota Hilux · R541,000", time: "24 min ago", tone: "warning" },
      { id: "a-3", title: "Deposit verified", detail: "Volkswagen Polo Vivo · DPS10031", time: "41 min ago", tone: "positive" },
    ],
  };
}

function loadState(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as DemoState) : seedState();
  } catch {
    return seedState();
  }
}

function money(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}m`;
  return ZAR_FORMATTER.format(value);
}

function number(value: number) { return NUMBER_FORMATTER.format(value); }

function getPageFromUrl(): PageKey {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get("view") as PageKey | null;
  const pages: PageKey[] = ["overview", "acquisition", "inventory", "reconditioning", "leads", "deals", "finance", "reports", "settings", "attention"];
  return value && pages.includes(value) ? value : "overview";
}

function Panel({ title, eyebrow, action, children, className = "" }: { title?: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>
    {(eyebrow || title || action) && <header className="panel-header">
      <div>{eyebrow && <div className="overline">{eyebrow}</div>}{title && <h2>{title}</h2>}</div>
      {action}
    </header>}
    {children}
  </section>;
}

function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) { return <span className={`status-pill ${tone}`}>{children}</span>; }

function TrendChart({ values, tone, labels }: { values: number[]; tone: "blue" | "green"; labels: string[] }) {
  const max = Math.max(...values) * 1.12;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${94 - (value / max) * 72}`).join(" ");
  const previous = values.map((value, index) => `${(index / (values.length - 1)) * 100},${98 - ((value * 0.64 + index * 4) / max) * 72}`).join(" ");
  return <div className="chart-wrap">
    <svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`${tone} trend chart`} role="img">
      {[22, 46, 70, 94].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="chart-grid" />)}
      <polyline points={previous} className="chart-previous" />
      <polyline points={points} className={`chart-current ${tone}`} />
      {values.map((value, index) => <circle key={value + index} cx={(index / (values.length - 1)) * 100} cy={94 - (value / max) * 72} r="1.3" className={`chart-dot ${tone}`} />)}
    </svg>
    <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
  </div>;
}

function MetricBlock({ label, value, delta, icon, tone = "positive", onClick }: { label: string; value: string; delta: string; icon: IconName; tone?: Tone; onClick?: () => void }) {
  const content = <><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon name={icon} size={17} /></span></div><div className="metric-value">{value}</div><div className={`metric-delta ${tone}`}><Icon name={tone === "warning" ? "arrowUp" : "arrowUp"} size={13} /> {delta}</div></>;
  return onClick ? <button className="metric-block interactive" onClick={onClick}>{content}</button> : <div className="metric-block">{content}</div>;
}

function VehicleThumb({ label, large = false }: { label: string; large?: boolean }) {
  return <div className={`vehicle-thumb ${large ? "large" : ""}`} aria-label={`${label} vehicle placeholder`}><div className="vehicle-glow" /><div className="vehicle-shape"><span>{label.slice(0, 1)}</span></div><div className="vehicle-ground" /></div>;
}

function App() {
  const [page, setPage] = useState<PageKey>(getPageFromUrl);
  const [state, setState] = useState<DemoState>(loadState);
  const [branch, setBranch] = useState("All branches");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("MTD");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [drawerVehicle, setDrawerVehicle] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const onPop = () => setPage(getPageFromUrl()); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);

  const navigate = (next: PageKey) => { setPage(next); window.history.pushState({}, "", `?view=${next}`); window.scrollTo({ top: 0, behavior: "smooth" }); setNoticeOpen(false); setProfileOpen(false); };
  const updateState = (updater: (current: DemoState) => DemoState, message?: string) => { setState((current) => updater(current)); if (message) setToast(message); };
  const branchVehicles = useMemo(() => state.vehicles.filter((vehicle) => branch === "All branches" || vehicle.branch === branch), [branch, state.vehicles]);
  const filteredVehicles = useMemo(() => branchVehicles.filter((vehicle) => `${vehicle.stock} ${vehicle.registration} ${vehicle.make} ${vehicle.model} ${vehicle.branch}`.toLowerCase().includes(query.toLowerCase())), [branchVehicles, query]);
  const filteredLeads = useMemo(() => state.leads.filter((lead) => `${lead.name} ${lead.vehicle} ${lead.source} ${lead.owner}`.toLowerCase().includes(query.toLowerCase())), [query, state.leads]);

  const addLead = (lead: Pick<Lead, "name" | "source" | "vehicle" | "branch">) => updateState((current) => ({ ...current, portfolio: { ...current.portfolio, newLeads: current.portfolio.newLeads + 1 }, leads: [{ id: `L-${1043 + current.leads.length}`, name: lead.name, source: lead.source, vehicle: lead.vehicle, branch: lead.branch, owner: "Unassigned", status: "New", age: "now", nextAction: "Assign buyer", priority: "info" }, ...current.leads], activities: [{ id: `a-${Date.now()}`, title: "New seller lead captured", detail: `${lead.name} · ${lead.vehicle}`, time: "just now", tone: "info" }, ...current.activities] }), "Seller lead captured and persisted");
  const addVehicle = (vehicle: Pick<Vehicle, "registration" | "make" | "model" | "branch" | "price">) => updateState((current) => ({ ...current, portfolio: { ...current.portfolio, stockOnHand: current.portfolio.stockOnHand + 1, capitalInStock: current.portfolio.capitalInStock + Math.round(vehicle.price * 0.78) }, vehicles: [{ id: `v-${Date.now()}`, stock: `MOS-${240130 + current.vehicles.length}`, registration: vehicle.registration, make: vehicle.make, model: vehicle.model, year: 2022, mileage: "New intake", branch: vehicle.branch, status: "Acquired", age: 0, landedCost: Math.round(vehicle.price * 0.78), price: vehicle.price, margin: 14.2, reconStatus: "Not started", location: "Check-in yard", thumbnail: vehicle.make }, ...current.vehicles], activities: [{ id: `a-${Date.now()}`, title: "Vehicle added to stock file", detail: `${vehicle.make} ${vehicle.model} · ${vehicle.registration}`, time: "just now", tone: "positive" }, ...current.activities] }), "Vehicle stock file created and persisted");
  const addPayment = (payment: Pick<Payment, "customer" | "vehicle" | "amount" | "method">) => updateState((current) => ({ ...current, payments: [{ id: `P-${10033 + current.payments.length}`, reference: `DPS${10033 + current.payments.length}`, customer: payment.customer, vehicle: payment.vehicle, amount: payment.amount, method: payment.method, status: "Awaiting verification", date: "20 May 2025 · just now" }, ...current.payments], activities: [{ id: `a-${Date.now()}`, title: "Payment logged", detail: `${payment.customer} · ${money(payment.amount)}`, time: "just now", tone: "warning" }, ...current.activities] }), "Payment logged for verification");
  const markJobComplete = (id: string) => updateState((current) => ({ ...current, reconJobs: current.reconJobs.map((job) => job.id === id ? { ...job, status: "Complete", actual: job.actual || job.budget } : job), activities: [{ id: `a-${Date.now()}`, title: "Reconditioning job completed", detail: id, time: "just now", tone: "positive" }, ...current.activities] }), "Reconditioning job marked complete");
  const markLeadContacted = (id: string) => updateState((current) => ({ ...current, leads: current.leads.map((lead) => lead.id === id ? { ...lead, status: "Contacted", age: "just now", nextAction: "Schedule appointment", priority: "positive" } : lead), activities: [{ id: `a-${Date.now()}`, title: "Lead response recorded", detail: id, time: "just now", tone: "positive" }, ...current.activities] }), "Lead response recorded");
  const reconcilePayment = (id: string) => updateState((current) => ({ ...current, payments: current.payments.map((payment) => payment.id === id ? { ...payment, status: "Reconciled" } : payment), activities: [{ id: `a-${Date.now()}`, title: "Payment reconciled", detail: id, time: "just now", tone: "positive" }, ...current.activities] }), "Payment reconciled");

  return <div className="app-shell">
    <Sidebar page={page} navigate={navigate} onQuickCreate={() => setQuickCreateOpen(true)} />
    <div className="app-frame">
      <header className="topbar">
        <div className="mobile-brand">Motor<span>OS</span></div>
        <div className="topbar-left">
          <div className="branch-select"><Icon name="building" size={18} /><select value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Select branch"><option>All branches</option><option>Midrand</option><option>Centurion</option><option>Johannesburg</option><option>Cape Town</option></select><Icon name="chevronDown" size={15} /></div>
          <div className="global-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stock, VIN, customer or deal" aria-label="Global search" /><kbd>⌘ K</kbd></div>
        </div>
        <div className="topbar-right">
          <span className="topbar-date"><Icon name="calendar" size={17} /> 20 May 2025 <Icon name="chevronDown" size={14} /></span>
          <div className="popover-wrap"><button className="icon-button notification-button" aria-label="Open notifications" onClick={() => { setNoticeOpen((value) => !value); setProfileOpen(false); }}><Icon name="bell" size={19} /><span>6</span></button>{noticeOpen && <NotificationPopover navigate={navigate} />}</div>
          <div className="popover-wrap"><button className="profile-button" onClick={() => { setProfileOpen((value) => !value); setNoticeOpen(false); }}><span className="avatar">TM</span><Icon name="chevronDown" size={14} /></button>{profileOpen && <ProfilePopover onClose={() => setProfileOpen(false)} />}</div>
        </div>
      </header>
      <main className="main-content">
        {page === "overview" && <Dashboard state={state} branch={branch} range={range} setRange={setRange} navigate={navigate} onVehicle={setDrawerVehicle} />}
        {page === "acquisition" && <AcquisitionPage leads={filteredLeads} onCreate={() => setQuickCreateOpen(true)} onMarkContacted={markLeadContacted} />}
        {page === "inventory" && <InventoryPage vehicles={filteredVehicles} query={query} setQuery={setQuery} branch={branch} onVehicle={setDrawerVehicle} onCreate={() => setQuickCreateOpen(true)} />}
        {page === "reconditioning" && <ReconditioningPage jobs={state.reconJobs} onComplete={markJobComplete} />}
        {page === "leads" && <LeadsPage leads={filteredLeads} onMarkContacted={markLeadContacted} onCreate={() => setQuickCreateOpen(true)} />}
        {page === "deals" && <DealsPage vehicles={state.vehicles} onToast={setToast} />}
        {page === "finance" && <FinancePage payments={state.payments} onReconcile={reconcilePayment} onCreate={() => setQuickCreateOpen(true)} />}
        {page === "reports" && <ReportsPage onToast={setToast} />}
        {page === "settings" && <SettingsPage onToast={setToast} />}
        {page === "attention" && <AttentionPage state={state} onVehicle={setDrawerVehicle} navigate={navigate} />}
      </main>
      <footer className="app-footer"><span>MotorOS pilot workspace · Demo records persisted locally in this browser</span><span><Icon name="refresh" size={13} /> Updated 5 min ago</span></footer>
    </div>
    {drawerVehicle && <VehicleDrawer vehicle={drawerVehicle} onClose={() => setDrawerVehicle(null)} onToast={setToast} />}
    {quickCreateOpen && <QuickCreateModal onClose={() => setQuickCreateOpen(false)} onLead={addLead} onVehicle={addVehicle} onPayment={addPayment} />}
    {toast && <div className="toast" role="status"><span className="toast-icon"><Icon name="check" size={15} /></span>{toast}</div>}
  </div>;
}

function Sidebar({ page, navigate, onQuickCreate }: { page: PageKey; navigate: (page: PageKey) => void; onQuickCreate: () => void }) {
  return <aside className="sidebar">
    <div className="brand">Motor<span>OS</span><small>Dealer operating system</small></div>
    <button className="quick-create" onClick={onQuickCreate}><Icon name="plus" size={17} /> <span>Quick create</span><kbd>Q</kbd></button>
    <nav aria-label="Primary navigation" className="side-nav">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map((item) => <button key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => navigate(item.key)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.key === "leads" && <b>12</b>}</button>)}</div>)}<div className="nav-group"><div className="nav-group-label">Governance</div><button className={`nav-item ${page === "attention" ? "active" : ""}`} onClick={() => navigate("attention")}><Icon name="shield" size={18} /><span>Needs attention</span><b className="attention-count">23</b></button></div></nav>
    <div className="sidebar-bottom"><div className="tenant-switch"><span className="tenant-mark"><Icon name="building" size={17} /></span><span><strong>Motor Group SA</strong><small>Group workspace</small></span><Icon name="chevronDown" size={14} /></div><div className="sidebar-user"><span className="avatar small">TM</span><span><strong>Thabo Mgidi</strong><small>Group manager</small></span><Icon name="chevronDown" size={14} /></div></div>
  </aside>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="overline">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>;
}

function Dashboard({ state, branch, range, setRange, navigate, onVehicle }: { state: DemoState; branch: string; range: string; setRange: (range: string) => void; navigate: (page: PageKey) => void; onVehicle: (vehicle: Vehicle) => void }) {
  const branchLabel = branch === "All branches" ? "your group" : `${branch} branch`;
  const recent = state.vehicles.filter((vehicle) => vehicle.status !== "Sold").slice(0, 3);
  return <>
    <PageHeading eyebrow="Executive command centre" title="Good morning, Thabo" description={`Here's what's happening across ${branchLabel} today.`} action={<button className="primary-button" onClick={() => navigate("attention")}><Icon name="alert" size={16} /> Review exceptions <span className="button-count">23</span></button>} />
    <div className="metric-grid">
      <MetricBlock label="Stock on hand" value={number(state.portfolio.stockOnHand)} delta="3.4% vs last month" icon="car" onClick={() => navigate("inventory")} />
      <MetricBlock label="Capital in stock" value={money(state.portfolio.capitalInStock, true)} delta="2.7% vs last month" icon="database" />
      <MetricBlock label="Units sold MTD" value={number(state.portfolio.unitsSold)} delta="8.6% vs last month" icon="ticket" onClick={() => navigate("deals")} />
      <MetricBlock label="Gross profit" value={money(state.portfolio.grossProfit, true)} delta="12.3% vs last month" icon="chart" />
      <MetricBlock label="Average stock age" value={`${state.portfolio.avgStockAge} days`} delta="5 days vs last month" icon="calendar" tone="warning" onClick={() => navigate("attention")} />
    </div>
    <div className="dashboard-grid charts-row">
      <Panel title="Sales trend" action={<div className="panel-actions"><div className="range-toggle">{["MTD", "3M", "12M"].map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div><StatusPill tone="positive">↑ 8.6%</StatusPill></div>}>
        <div className="chart-meta"><span><i className="legend-line blue" /> Units sold</span><span><i className="legend-line previous" /> Units sold (prev. year)</span><strong>MTD {state.portfolio.unitsSold}</strong></div><TrendChart values={range === "MTD" ? state.salesTrend : range === "3M" ? state.salesTrend.slice(1) : [...state.salesTrend, 702, 680, 724]} tone="blue" labels={range === "12M" ? ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
      </Panel>
      <Panel title="Gross profit trend" action={<div className="panel-actions"><strong className="panel-value">MTD {money(state.portfolio.grossProfit, true)}</strong><StatusPill tone="positive">↑ 12.3%</StatusPill></div>}>
        <div className="chart-meta"><span><i className="legend-line green" /> Gross profit (R'm)</span><span><i className="legend-line previous" /> Gross profit (prev. year)</span></div><TrendChart values={state.profitTrend} tone="green" labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
      </Panel>
      <AttentionPanel state={state} navigate={navigate} onVehicle={onVehicle} />
    </div>
    <div className="dashboard-grid lower-row">
      <Panel title="Stock age risk" action={<button className="inline-icon" aria-label="Stock age information"><Icon name="alert" size={15} /></button>} className="age-panel">
        <div className="age-list"><AgeRow label="0 – 30 days" count="612" percent="49%" tone="positive" /><AgeRow label="31 – 60 days" count="342" percent="27%" tone="warning" /><AgeRow label="61 – 90 days" count="178" percent="14%" tone="warning" /><AgeRow label="90+ days" count="116" percent="9%" tone="critical" /></div><div className="age-average"><span>Average stock age:</span><strong>{state.portfolio.avgStockAge} days</strong></div>
      </Panel>
      <Panel title="Branch performance" action={<button className="text-button" onClick={() => navigate("reports")}>View report <Icon name="arrowRight" size={14} /></button>} className="branch-panel"><BranchTable /></Panel>
      <Panel title="Recent activity" action={<button className="text-button" onClick={() => navigate("attention")}>View all <Icon name="arrowRight" size={14} /></button>} className="activity-panel">{state.activities.slice(0, 3).map((activity) => <div className="activity-row" key={activity.id}><span className={`activity-dot ${activity.tone}`}><Icon name={activity.tone === "positive" ? "check" : activity.tone === "warning" ? "alert" : "arrowRight"} size={13} /></span><div><strong>{activity.title}</strong><span>{activity.detail}</span></div><time>{activity.time}</time></div>)}</Panel>
    </div>
    <div className="dashboard-note"><span>All comparisons are vs the prior month unless otherwise stated.</span><span><Icon name="refresh" size={13} /> Data updated 5 min ago</span></div>
    {recent.length === 0 && <div className="sr-only">No active vehicles currently match this view.</div>}
  </>;
}

function AgeRow({ label, count, percent, tone }: { label: string; count: string; percent: string; tone: Tone }) { return <div className={`age-row ${tone}`}><span>{label}</span><strong>{count}</strong><small>{percent}</small></div>; }

function BranchTable() { return <div className="table-scroll"><table className="data-table"><thead><tr><th>Branch</th><th>Stock on hand</th><th>Units sold MTD</th><th>Gross profit MTD</th><th>Age</th><th>vs last month</th></tr></thead><tbody>{[["Midrand", "312", "156", "R3.9m", "34", "↑ 10.2%"], ["Centurion", "298", "138", "R3.2m", "36", "↑ 6.8%"], ["Johannesburg", "356", "172", "R4.2m", "41", "↓ 1.2%"], ["Cape Town", "282", "146", "R3.5m", "42", "↑ 4.5%"]].map((row) => <tr key={row[0]}>{row.map((value, index) => <td key={value} className={index === 5 ? value.startsWith("↓") ? "negative" : "positive-text" : ""}>{value}</td>)}</tr>)}</tbody><tfoot><tr><th>Total / Average</th><th>1,248</th><th>612</th><th>R14.8m</th><th>38</th><th className="positive-text">↑ 5.3%</th></tr></tfoot></table></div>; }

function AttentionPanel({ state, navigate, onVehicle }: { state: DemoState; navigate: (page: PageKey) => void; onVehicle: (vehicle: Vehicle) => void }) {
  const overdue = state.vehicles.filter((vehicle) => vehicle.status === "Inspection");
  return <Panel title="Needs attention" action={<button className="attention-total" onClick={() => navigate("attention")}>23</button>} className="attention-panel"><div className="attention-group"><div className="attention-heading"><span className="attention-icon warning"><Icon name="wrench" size={16} /></span><strong>Overdue inspections</strong><StatusPill tone="warning">8</StatusPill></div>{overdue.slice(0, 3).map((vehicle) => <button className="attention-item" key={vehicle.id} onClick={() => onVehicle(vehicle)}><span>{vehicle.registration}</span><span>{vehicle.make} {vehicle.model}</span><b>{vehicle.age} days</b></button>)}<button className="attention-link" onClick={() => navigate("attention")}>View all (8) <Icon name="arrowRight" size={14} /></button></div><div className="attention-group"><div className="attention-heading"><span className="attention-icon warning"><Icon name="wallet" size={16} /></span><strong>Deposits awaiting verification</strong><StatusPill tone="warning">7</StatusPill></div>{state.payments.filter((payment) => payment.status === "Awaiting verification").slice(0, 2).map((payment) => <div className="attention-item static" key={payment.id}><span>{payment.reference}</span><span>{payment.customer}</span><b>{money(payment.amount)}</b></div>)}<button className="attention-link" onClick={() => navigate("finance")}>View all (7) <Icon name="arrowRight" size={14} /></button></div><div className="attention-group"><div className="attention-heading"><span className="attention-icon critical"><Icon name="clock" size={16} /></span><strong>Slow stock (90+ days)</strong><StatusPill tone="critical">8</StatusPill></div>{state.vehicles.filter((vehicle) => vehicle.age > 90).slice(0, 2).map((vehicle) => <div className="attention-item static" key={vehicle.id}><span>{vehicle.registration}</span><span>{vehicle.make} {vehicle.model}</span><b>{vehicle.age} days</b></div>)}<button className="attention-link" onClick={() => navigate("inventory")}>View all (8) <Icon name="arrowRight" size={14} /></button></div></Panel>;
}

function AcquisitionPage({ leads, onCreate, onMarkContacted }: { leads: Lead[]; onCreate: () => void; onMarkContacted: (id: string) => void }) {
  return <><PageHeading eyebrow="Acquisition" title="Seller pipeline" description="Capture, qualify, inspect, and convert every source of stock." action={<button className="primary-button" onClick={onCreate}><Icon name="plus" size={16} /> New seller lead</button>} /><div className="summary-strip"><Summary label="New leads" value="86" detail="this month" tone="info" /><Summary label="Awaiting response" value="12" detail="SLA breach risk" tone="critical" /><Summary label="Appointments" value="34" detail="next 7 days" tone="positive" /><Summary label="Offer conversion" value="42%" detail="+4.8% vs last month" tone="positive" /></div><div className="pipeline-board">{["New", "Qualified", "Inspection", "Offer sent", "Purchased"].map((stage) => <div className="pipeline-column" key={stage}><div className="pipeline-column-head"><strong>{stage}</strong><span>{leads.filter((lead) => lead.status === stage).length || (stage === "New" ? 4 : stage === "Qualified" ? 3 : stage === "Inspection" ? 5 : 2)}</span></div>{leads.filter((lead) => lead.status === stage).slice(0, 4).map((lead) => <LeadCard key={lead.id} lead={lead} onMarkContacted={onMarkContacted} />)}{leads.filter((lead) => lead.status === stage).length === 0 && <div className="pipeline-empty">No records in this stage</div>}</div>)}</div><Panel title="Recent acquisition activity" action={<button className="secondary-button" onClick={onCreate}><Icon name="plus" size={15} /> Capture lead</button>}><LeadTable leads={leads} onMarkContacted={onMarkContacted} /></Panel></>;
}

function LeadCard({ lead, onMarkContacted }: { lead: Lead; onMarkContacted: (id: string) => void }) { return <article className="lead-card"><div className="lead-card-top"><span className={`priority-dot ${lead.priority}`} /><strong>{lead.name}</strong><button className="inline-icon" aria-label={`More actions for ${lead.name}`}><Icon name="more" size={16} /></button></div><span className="lead-vehicle">{lead.vehicle}</span><div className="lead-card-meta"><span>{lead.source}</span><span>{lead.age}</span></div><button className="card-action" onClick={() => onMarkContacted(lead.id)}>{lead.nextAction} <Icon name="arrowRight" size={13} /></button></article>; }

function LeadTable({ leads, onMarkContacted }: { leads: Lead[]; onMarkContacted: (id: string) => void }) { return <div className="table-scroll"><table className="data-table"><thead><tr><th>Lead</th><th>Source</th><th>Vehicle</th><th>Branch</th><th>Owner</th><th>Status</th><th>Next action</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.id}</small></td><td>{lead.source}</td><td>{lead.vehicle}</td><td>{lead.branch}</td><td>{lead.owner}</td><td><StatusPill tone={lead.priority}>{lead.status}</StatusPill></td><td><button className="table-action" onClick={() => onMarkContacted(lead.id)}>{lead.nextAction}</button></td></tr>)}</tbody></table></div>; }

function InventoryPage({ vehicles, query, setQuery, branch, onVehicle, onCreate }: { vehicles: Vehicle[]; query: string; setQuery: (value: string) => void; branch: string; onVehicle: (vehicle: Vehicle) => void; onCreate: () => void }) { return <><PageHeading eyebrow="Inventory" title="Vehicle stock file" description={`One operational record for every vehicle across ${branch === "All branches" ? "the group" : branch}.`} action={<button className="primary-button" onClick={onCreate}><Icon name="plus" size={16} /> Add vehicle</button>} /><div className="inventory-toolbar"><div className="field-search"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registration, VIN, make or stock number" aria-label="Search inventory" /></div><div className="toolbar-actions"><button className="secondary-button"><Icon name="filter" size={15} /> Filters <span className="filter-count">3</span></button><button className="secondary-button"><Icon name="download" size={15} /> Export</button><button className="icon-button" aria-label="Customize inventory columns"><Icon name="settings" size={16} /></button></div></div><div className="inventory-stats"><Summary label="Retail-ready" value="612" detail="49% of stock" tone="positive" /><Summary label="In recon" value="178" detail="14% of stock" tone="warning" /><Summary label="90+ days" value="116" detail="management review" tone="critical" /><Summary label="Retail value" value="R312.4m" detail="+4.1% vs last month" tone="info" /></div><Panel title={`${vehicles.length} vehicle records`} action={<div className="panel-actions"><span className="muted">Last synced 5 min ago</span><button className="text-button">Saved views <Icon name="chevronDown" size={14} /></button></div>}><VehicleTable vehicles={vehicles} onVehicle={onVehicle} /></Panel></>; }

function VehicleTable({ vehicles, onVehicle }: { vehicles: Vehicle[]; onVehicle: (vehicle: Vehicle) => void }) { return <div className="table-scroll"><table className="data-table inventory-table"><thead><tr><th>Vehicle</th><th>Branch</th><th>Status</th><th>Location</th><th>Age</th><th>Landed cost</th><th>Asking price</th><th>Margin</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.id} onClick={() => onVehicle(vehicle)} className="clickable-row"><td><div className="vehicle-cell"><VehicleThumb label={vehicle.thumbnail} /><span><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.stock} · {vehicle.registration} · {vehicle.mileage}</small></span></div></td><td>{vehicle.branch}</td><td><StatusPill tone={vehicle.status === "Retail ready" || vehicle.status === "Sold" ? "positive" : vehicle.status === "Transfer" || vehicle.status === "Recon" ? "warning" : vehicle.status === "Reserved" ? "info" : "neutral"}>{vehicle.status}</StatusPill></td><td>{vehicle.location}</td><td className={vehicle.age > 90 ? "negative" : ""}>{vehicle.age} days</td><td>{money(vehicle.landedCost)}</td><td><strong>{money(vehicle.price)}</strong></td><td className="positive-text">{vehicle.margin.toFixed(1)}%</td><td><button className="inline-icon" aria-label={`Open ${vehicle.stock}`} onClick={(event) => { event.stopPropagation(); onVehicle(vehicle); }}><Icon name="arrowRight" size={16} /></button></td></tr>)}</tbody></table>{vehicles.length === 0 && <div className="empty-state"><Icon name="search" size={24} /><strong>No vehicles match this search</strong><span>Try a stock number, registration, make, or branch.</span></div>}</div>; }

function ReconditioningPage({ jobs, onComplete }: { jobs: ReconJob[]; onComplete: (id: string) => void }) { return <><PageHeading eyebrow="Reconditioning" title="Workshop control" description="Track approved budgets, blockers, supplier work, and time-to-retail-ready." action={<button className="primary-button"><Icon name="plus" size={16} /> New job card</button>} /><div className="summary-strip"><Summary label="Active jobs" value="42" detail="across 4 branches" tone="info" /><Summary label="Overdue" value="8" detail="needs escalation" tone="critical" /><Summary label="Budget variance" value="R34.6k" detail="this month" tone="warning" /><Summary label="Avg cycle time" value="6.4 days" detail="−0.8 days vs last month" tone="positive" /></div><Panel title="Open job cards" action={<div className="panel-actions"><button className="secondary-button"><Icon name="filter" size={15} /> Filter</button><button className="secondary-button"><Icon name="download" size={15} /> Export</button></div>}><div className="table-scroll"><table className="data-table"><thead><tr><th>Job card</th><th>Vehicle</th><th>Category</th><th>Supplier</th><th>Status</th><th>Due</th><th>Budget</th><th>Actual</th><th /></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td><strong>{job.id}</strong><small>{job.stock}</small></td><td>{job.vehicle}</td><td>{job.category}</td><td>{job.supplier}</td><td><StatusPill tone={job.status === "Complete" ? "positive" : job.status === "Overdue" ? "critical" : "warning"}>{job.status}</StatusPill></td><td>{job.due}</td><td>{money(job.budget)}</td><td className={job.actual > job.budget ? "negative" : ""}>{job.actual ? money(job.actual) : "—"}</td><td>{job.status !== "Complete" && <button className="table-action" onClick={() => onComplete(job.id)}>Mark complete</button>}</td></tr>)}</tbody></table></div></Panel><div className="recon-split"><Panel title="Supplier performance"><SupplierTable /></Panel><Panel title="Recon gates"><GateList /></Panel></div></>; }

function SupplierTable() { return <div className="supplier-list"><div><strong>AutoFix Midrand</strong><span>12 jobs · 6.2 day avg</span><StatusPill tone="warning">82% on time</StatusPill></div><div><strong>TyrePro Cape Town</strong><span>8 jobs · 4.1 day avg</span><StatusPill tone="positive">96% on time</StatusPill></div><div><strong>Internal workshop</strong><span>22 jobs · 5.8 day avg</span><StatusPill tone="positive">91% on time</StatusPill></div></div>; }
function GateList() { return <div className="gate-list"><div><span className="gate-check complete"><Icon name="check" size={14} /></span><span><strong>Mandatory identity verification</strong><small>Every vehicle</small></span><StatusPill tone="positive">Passing</StatusPill></div><div><span className="gate-check complete"><Icon name="check" size={14} /></span><span><strong>Inspection scorecard</strong><small>Photo evidence required</small></span><StatusPill tone="positive">Passing</StatusPill></div><div><span className="gate-check warning"><Icon name="clock" size={14} /></span><span><strong>Recon estimate approval</strong><small>Manager threshold R15k</small></span><StatusPill tone="warning">2 pending</StatusPill></div></div>; }

function LeadsPage({ leads, onMarkContacted, onCreate }: { leads: Lead[]; onMarkContacted: (id: string) => void; onCreate: () => void }) { return <><PageHeading eyebrow="Buyer CRM" title="Lead command centre" description="Keep response time, ownership, and next actions visible across every channel." action={<button className="primary-button" onClick={onCreate}><Icon name="plus" size={16} /> New buyer lead</button>} /><div className="lead-metrics"><MetricBlock label="Open leads" value="248" delta="14.2% vs last month" icon="users" /><MetricBlock label="Median first response" value="18 min" delta="−4 min vs last month" icon="clock" tone="positive" /><MetricBlock label="Appointments booked" value="64" delta="8.9% vs last month" icon="calendar" /><MetricBlock label="Conversion" value="11.8%" delta="1.2 pts vs last month" icon="target" /></div><div className="lead-layout"><Panel title="Response queue" action={<div className="panel-actions"><StatusPill tone="critical">12 SLA risks</StatusPill><button className="secondary-button"><Icon name="filter" size={15} /> Filter</button></div>}><LeadTable leads={leads} onMarkContacted={onMarkContacted} /></Panel><Panel title="Next actions" action={<button className="text-button">Calendar <Icon name="arrowRight" size={14} /></button>}><div className="next-action-list">{leads.slice(0, 4).map((lead) => <button key={lead.id} className="next-action" onClick={() => onMarkContacted(lead.id)}><span className={`next-action-icon ${lead.priority}`}><Icon name={lead.priority === "critical" ? "alert" : lead.priority === "positive" ? "calendar" : "phone"} size={15} /></span><span><strong>{lead.nextAction}</strong><small>{lead.name} · {lead.age}</small></span><Icon name="arrowRight" size={15} /></button>)}</div></Panel></div></>; }

function DealsPage({ vehicles, onToast }: { vehicles: Vehicle[]; onToast: (message: string) => void }) { return <><PageHeading eyebrow="Deal desk" title="Deals and approvals" description="Protect gross profit while moving approved deals through to delivery." action={<button className="primary-button" onClick={() => onToast("New deal builder opened") }><Icon name="plus" size={16} /> New deal</button>} /><div className="deal-summary"><Summary label="Open deals" value="38" detail="R7.4m gross pipeline" tone="info" /><Summary label="Approval required" value="6" detail="manager review" tone="warning" /><Summary label="Deposit pending" value="11" detail="R342k outstanding" tone="critical" /><Summary label="Ready for delivery" value="9" detail="next 7 days" tone="positive" /></div><Panel title="Deal pipeline" action={<div className="panel-actions"><button className="secondary-button"><Icon name="filter" size={15} /> Filters</button><button className="secondary-button"><Icon name="download" size={15} /> Export</button></div>}><div className="table-scroll"><table className="data-table"><thead><tr><th>Deal</th><th>Customer</th><th>Vehicle</th><th>Sales exec</th><th>Stage</th><th>Gross profit</th><th>Last activity</th><th /></tr></thead><tbody>{vehicles.slice(2, 7).map((vehicle, index) => <tr key={vehicle.id}><td><strong>D-{441 - index}</strong><small>Created {index + 1}d ago</small></td><td>{["Sipho Dlamini", "Lerato Mokoena", "Jason Naidoo", "Zanele Khumalo", "Liam van der Merwe"][index]}</td><td>{vehicle.year} {vehicle.make} {vehicle.model}</td><td>{index % 2 ? "Lerato M." : "Thabo M."}</td><td><StatusPill tone={index === 1 ? "warning" : index === 3 ? "positive" : "info"}>{["Approval required", "Deposit pending", "Finance pending", "Ready for delivery", "Proposal"][index]}</StatusPill></td><td className="positive-text">{money(vehicle.price - vehicle.landedCost)}</td><td>{index + 1}h ago</td><td><button className="table-action" onClick={() => onToast(`Deal D-${441 - index} opened in deal builder`)}>Open</button></td></tr>)}</tbody></table></div></Panel><div className="deal-bottom"><Panel title="Approval rules"><div className="approval-list"><div><span className="approval-icon warning"><Icon name="alert" size={16} /></span><span><strong>Below-margin discount</strong><small>Requires sales manager + branch manager</small></span><StatusPill tone="warning">3 pending</StatusPill></div><div><span className="approval-icon info"><Icon name="shield" size={16} /></span><span><strong>Offer above R500k</strong><small>Requires group owner approval</small></span><StatusPill tone="positive">Healthy</StatusPill></div><div><span className="approval-icon positive"><Icon name="check" size={16} /></span><span><strong>Reservation conflict check</strong><small>Transactional vehicle lock enabled</small></span><StatusPill tone="positive">Passing</StatusPill></div></div></Panel><Panel title="Gross profit guardrail"><div className="guardrail-number">14.0%</div><div className="guardrail-bar"><span style={{ width: "72%" }} /></div><div className="guardrail-footer"><span>Current weighted margin</span><strong>Target 15.0%</strong></div></Panel></div></>; }

function FinancePage({ payments, onReconcile, onCreate }: { payments: Payment[]; onReconcile: (id: string) => void; onCreate: () => void }) { return <><PageHeading eyebrow="Finance control" title="Payments and reconciliation" description="Track deposits, allocations, exceptions, and the daily branch closeout." action={<button className="primary-button" onClick={onCreate}><Icon name="plus" size={16} /> Log payment</button>} /><div className="finance-summary"><Summary label="Received MTD" value="R9.8m" detail="+7.4% vs last month" tone="positive" /><Summary label="Awaiting verification" value="R70k" detail="7 deposits" tone="warning" /><Summary label="Unreconciled" value="R30k" detail="1 exception" tone="critical" /><Summary label="Refund approvals" value="1" detail="R12.5k pending" tone="info" /></div><div className="finance-layout"><Panel title="Reconciliation queue" action={<div className="panel-actions"><button className="secondary-button"><Icon name="filter" size={15} /> Filter</button><button className="text-button">Bank import <Icon name="arrowRight" size={14} /></button></div>}><div className="table-scroll"><table className="data-table"><thead><tr><th>Reference</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><strong>{payment.reference}</strong><small>{payment.id}</small></td><td>{payment.customer}</td><td>{payment.vehicle}</td><td><strong>{money(payment.amount)}</strong></td><td>{payment.method}</td><td><StatusPill tone={payment.status === "Reconciled" || payment.status === "Allocated" || payment.status === "Received" ? "positive" : payment.status === "Unreconciled" ? "critical" : "warning"}>{payment.status}</StatusPill></td><td>{payment.date}</td><td>{payment.status !== "Reconciled" && <button className="table-action" onClick={() => onReconcile(payment.id)}>Reconcile</button>}</td></tr>)}</tbody></table></div></Panel><Panel title="Daily closeout" action={<button className="text-button">Open closeout <Icon name="arrowRight" size={14} /></button>}><div className="closeout-list"><div><span>Opening balance</span><strong>R342,800</strong></div><div><span>Cash / card received</span><strong>R128,400</strong></div><div><span>EFT received</span><strong>R486,200</strong></div><div><span>Refunds / adjustments</span><strong className="negative">−R12,500</strong></div><div className="closeout-total"><span>Expected closing balance</span><strong>R944,900</strong></div></div><button className="secondary-button full-width"><Icon name="receipt" size={15} /> Generate closeout report</button></Panel></div></>; }

function ReportsPage({ onToast }: { onToast: (message: string) => void }) {
  return <>
    <PageHeading eyebrow="Reporting" title="Trusted reports" description="Use the same operational definitions in management views and exports." action={<button className="secondary-button" onClick={() => onToast("Report export queued")}><Icon name="download" size={16} /> Export centre</button>} />
    <div className="report-toolbar"><div className="field-search"><Icon name="search" size={16} /><input placeholder="Search reports" aria-label="Search reports" /></div><button className="secondary-button"><Icon name="calendar" size={15} /> May 2025 <Icon name="chevronDown" size={14} /></button><button className="secondary-button"><Icon name="building" size={15} /> All branches <Icon name="chevronDown" size={14} /></button></div>
    <div className="report-grid">{reportDefinitions.map((report) => <article className="report-card" key={report.title}><div className="report-card-icon"><Icon name={report.icon} size={20} /></div><div><h2>{report.title}</h2><p>{report.description}</p><span>{report.updated}</span></div><button className="report-open" aria-label={`Open ${report.title}`} onClick={() => onToast(`${report.title} opened`)}><Icon name="arrowRight" size={16} /></button></article>)}</div>
    <div className="report-note"><Icon name="shield" size={16} /><span>Reports respect branch scope and permission checks. Exports create an audit event and run asynchronously for large datasets.</span></div>
  </>;
}

function SettingsPage({ onToast }: { onToast: (message: string) => void }) { return <><PageHeading eyebrow="Administration" title="MotorOS settings" description="Configure branches, permissions, integrations, and operational rules." action={<button className="primary-button" onClick={() => onToast("Settings saved") }><Icon name="check" size={16} /> Save changes</button>} /><div className="settings-layout"><Panel title="Dealer group"><div className="settings-form"><label>Group name<input defaultValue="Motor Group SA" /></label><label>Default currency<select defaultValue="ZAR"><option value="ZAR">ZAR · South African rand</option></select></label><label>Timezone<select defaultValue="Africa/Windhoek"><option>Africa/Windhoek</option><option>Africa/Johannesburg</option></select></label><label>Tax configuration<input defaultValue="VAT registered · 15%" /></label></div></Panel><Panel title="Branches" action={<button className="secondary-button" onClick={() => onToast("Branch creation flow opened")}><Icon name="plus" size={15} /> Add branch</button>}><div className="branch-settings"><div><span className="branch-code">MR</span><span><strong>Midrand</strong><small>312 active vehicles · 28 users</small></span><StatusPill tone="positive">Operational</StatusPill><button className="inline-icon" aria-label="More actions for Midrand" onClick={() => onToast("Midrand branch actions opened")}><Icon name="more" size={16} /></button></div><div><span className="branch-code">CE</span><span><strong>Centurion</strong><small>298 active vehicles · 24 users</small></span><StatusPill tone="positive">Operational</StatusPill><button className="inline-icon" aria-label="More actions for Centurion" onClick={() => onToast("Centurion branch actions opened")}><Icon name="more" size={16} /></button></div><div><span className="branch-code">JB</span><span><strong>Johannesburg</strong><small>356 active vehicles · 31 users</small></span><StatusPill tone="positive">Operational</StatusPill><button className="inline-icon" aria-label="More actions for Johannesburg" onClick={() => onToast("Johannesburg branch actions opened")}><Icon name="more" size={16} /></button></div><div><span className="branch-code">CT</span><span><strong>Cape Town</strong><small>282 active vehicles · 21 users</small></span><StatusPill tone="positive">Operational</StatusPill><button className="inline-icon" aria-label="More actions for Cape Town" onClick={() => onToast("Cape Town branch actions opened")}><Icon name="more" size={16} /></button></div></div></Panel><Panel title="Integrations" action={<StatusPill tone="warning">Sandbox mode</StatusPill>}><div className="integration-list"><div><span className="integration-icon whatsapp">W</span><span><strong>WhatsApp Cloud API</strong><small>Message history adapter · credentials masked</small></span><StatusPill tone="neutral">Disconnected</StatusPill><button className="text-button" onClick={() => onToast("WhatsApp configuration opened")}>Configure</button></div><div><span className="integration-icon verify"><Icon name="shield" size={16} /></span><span><strong>Vehicle verification</strong><small>Provider adapter ready · no credentials configured</small></span><StatusPill tone="warning">Sandbox</StatusPill><button className="text-button" onClick={() => onToast("Verification adapter test queued")}>Test</button></div><div><span className="integration-icon payments"><Icon name="card" size={16} /></span><span><strong>Payments gateway</strong><small>Webhook contract ready · replay protection enabled</small></span><StatusPill tone="positive">Connected</StatusPill><button className="text-button" onClick={() => onToast("Gateway health check passed")}>Health</button></div></div></Panel></div><div className="compliance-note"><Icon name="shield" size={17} /><div><strong>Operational compliance support</strong><span>Configured workflows support operational compliance but do not replace legal advice or official registration and reporting obligations.</span></div></div></>; }

function AttentionPage({ state, onVehicle, navigate }: { state: DemoState; onVehicle: (vehicle: Vehicle) => void; navigate: (page: PageKey) => void }) {
  const overdue = state.vehicles.filter((vehicle) => vehicle.age > 90 || vehicle.status === "Inspection");
  const paymentsToReview = state.payments.reduce<Payment[]>((items, payment) => {
    if (payment.status === "Awaiting verification" || payment.status === "Unreconciled") items.push(payment);
    return items;
  }, []);
  return <><PageHeading eyebrow="Governance" title="Needs attention" description="Exceptions are grouped by operational risk, owner, and next action." action={<button className="secondary-button" onClick={() => navigate("reports")}><Icon name="download" size={15} /> Export exceptions</button>} /><div className="attention-summary"><Summary label="Total exceptions" value="23" detail="across 4 branches" tone="critical" /><Summary label="High risk" value="8" detail="requires action today" tone="critical" /><Summary label="Assigned" value="19" detail="83% have an owner" tone="positive" /><Summary label="Resolved this week" value="41" detail="+12 vs prior week" tone="info" /></div><div className="attention-grid"><Panel title="Overdue inspections" action={<StatusPill tone="warning">8 open</StatusPill>}><div className="exception-list">{overdue.map((vehicle) => <button key={vehicle.id} className="exception-row" onClick={() => onVehicle(vehicle)}><span className="exception-icon warning"><Icon name="wrench" size={17} /></span><span><strong>{vehicle.registration} · {vehicle.make} {vehicle.model}</strong><small>{vehicle.branch} · {vehicle.location}</small></span><span className="exception-age">{vehicle.age} days</span><Icon name="arrowRight" size={16} /></button>)}</div></Panel><Panel title="Payments and reconciliation" action={<button className="text-button" onClick={() => navigate("finance")}>Open finance <Icon name="arrowRight" size={14} /></button>}><div className="exception-list">{paymentsToReview.map((payment) => <button className="exception-row" key={payment.id} onClick={() => navigate("finance")}><span className="exception-icon warning"><Icon name="wallet" size={17} /></span><span><strong>{payment.reference} · {payment.customer}</strong><small>{payment.vehicle} · {payment.method}</small></span><span className="exception-age">{money(payment.amount)}</span><Icon name="arrowRight" size={16} /></button>)}</div></Panel></div></>;
}

function Summary({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) { return <div className={`summary ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }

function VehicleDrawer({ vehicle, onClose, onToast }: { vehicle: Vehicle; onClose: () => void; onToast: (message: string) => void }) { const totalCost = landedCost({ acquisitionPrice: vehicle.landedCost - 11_200, transport: 4_500, verification: 900, reconditioning: 5_000, parts: 800, labour: 0, allocatedDirectCosts: 0, otherApprovedVehicleCosts: 0 }); const profit = projectedGrossProfit(vehicle.price, totalCost, 4_500); return <dialog open aria-label="Vehicle stock file drawer" className="drawer-backdrop"><aside className="vehicle-drawer" aria-label="Vehicle stock file"><div className="drawer-header"><div><div className="overline">Vehicle stock file</div><h2>{vehicle.stock}</h2></div><button className="icon-button" aria-label="Close vehicle drawer" onClick={onClose}><Icon name="close" size={18} /></button></div><div className="drawer-hero"><VehicleThumb label={vehicle.thumbnail} large /><div><StatusPill tone={vehicle.status === "Retail ready" ? "positive" : vehicle.status === "Transfer" ? "warning" : "info"}>{vehicle.status}</StatusPill><h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3><span>{vehicle.registration} · {vehicle.mileage}</span></div></div><div className="drawer-actions"><button className="primary-button" onClick={() => onToast("Inspection workflow opened") }><Icon name="wrench" size={15} /> Open inspection</button><button className="secondary-button" onClick={() => onToast("Vehicle transfer flow opened") }><Icon name="truck" size={15} /> Transfer</button></div><div className="drawer-tabs"><button className="selected">Overview</button><button onClick={() => onToast("Costs tab opened")}>Costs</button><button onClick={() => onToast("Audit history opened")}>Audit history</button></div><div className="drawer-grid"><div><span>Branch</span><strong>{vehicle.branch}</strong></div><div><span>Location</span><strong>{vehicle.location}</strong></div><div><span>Age</span><strong className={vehicle.age > 90 ? "negative" : ""}>{vehicle.age} days</strong></div><div><span>Recon status</span><strong>{vehicle.reconStatus}</strong></div></div><Panel title="Profit snapshot" className="drawer-panel"><div className="profit-lines"><div><span>Landed cost</span><strong>{money(totalCost)}</strong></div><div><span>Asking price</span><strong>{money(vehicle.price)}</strong></div><div><span>Projected deal costs</span><strong>−{money(4_500)}</strong></div><div className="profit-total"><span>Projected gross profit</span><strong>{money(profit)}</strong></div></div><div className="margin-meter"><span style={{ width: `${Math.min(vehicle.margin * 4, 100)}%` }} /></div><small>Projected margin {projectedMarginPercent(vehicle.price, profit).toFixed(1)}% · recommendation confidence 88%</small></Panel><Panel title="Latest activity" className="drawer-panel"><div className="drawer-activity"><div><span className="activity-dot positive"><Icon name="check" size={12} /></span><span><strong>VIN verification passed</strong><small>Identity provider adapter · 10:05</small></span></div><div><span className="activity-dot info"><Icon name="arrowRight" size={12} /></span><span><strong>Inspection assigned</strong><small>Lerato M. · 10:19</small></span></div><div><span className="activity-dot warning"><Icon name="alert" size={12} /></span><span><strong>Finance settlement requested</strong><small>Seller lead · today</small></span></div></div></Panel></aside></dialog>; }

function Modal({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) { return <dialog open aria-labelledby="modal-title" className="modal-backdrop"><div className="modal"><div className="modal-header"><div><div className="overline">Quick create</div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="icon-button" aria-label="Close modal" onClick={onClose}><Icon name="close" size={18} /></button></div>{children}</div></dialog>; }

function QuickCreateModal({ onClose, onLead, onVehicle, onPayment }: { onClose: () => void; onLead: (lead: Pick<Lead, "name" | "source" | "vehicle" | "branch">) => void; onVehicle: (vehicle: Pick<Vehicle, "registration" | "make" | "model" | "branch" | "price">) => void; onPayment: (payment: Pick<Payment, "customer" | "vehicle" | "amount" | "method">) => void }) {
  const [mode, setMode] = useState<"lead" | "vehicle" | "payment">("lead");
  const [name, setName] = useState(""); const [source, setSource] = useState("Phone"); const [vehicle, setVehicle] = useState(""); const [selectedBranch, setSelectedBranch] = useState("Midrand"); const [registration, setRegistration] = useState(""); const [make, setMake] = useState("Toyota"); const [model, setModel] = useState(""); const [price, setPrice] = useState("350000"); const [amount, setAmount] = useState("25000"); const [method, setMethod] = useState("EFT");
  const submit = (event: FormEvent) => { event.preventDefault(); if (mode === "lead" && name && vehicle) onLead({ name, source, vehicle, branch: selectedBranch }); if (mode === "vehicle" && registration && model) onVehicle({ registration, make, model, branch: selectedBranch, price: Number(price) || 0 }); if (mode === "payment" && name && vehicle) onPayment({ customer: name, vehicle, amount: Number(amount) || 0, method }); onClose(); };
  return <Modal title="Create operational record" description="Demo records are persisted in this browser and appear in the relevant workspace immediately." onClose={onClose}><div className="create-tabs">{[["lead", "Seller lead", "users"], ["vehicle", "Add vehicle", "car"], ["payment", "Payment", "wallet"]].map(([key, label, icon]) => <button key={key} className={mode === key ? "selected" : ""} onClick={() => setMode(key as typeof mode)}><Icon name={icon as IconName} size={16} />{label}</button>)}</div><form onSubmit={submit} className="create-form">{mode === "lead" && <><label>Seller name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Kabelo Mokoena" /></label><label>Vehicle description<input required value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="e.g. 2021 Toyota Fortuner" /></label><div className="form-grid"><label>Source<select value={source} onChange={(event) => setSource(event.target.value)}><option>Phone</option><option>WhatsApp</option><option>Website form</option><option>Referral</option></select></label><label>Branch<select value={selectedBranch} onChange={(event) => setSelectedBranch(event.target.value)}><option>Midrand</option><option>Centurion</option><option>Johannesburg</option><option>Cape Town</option></select></label></div></>}{mode === "vehicle" && <><label>Registration<input required value={registration} onChange={(event) => setRegistration(event.target.value)} placeholder="CAA 000 GP" /></label><div className="form-grid"><label>Make<input required value={make} onChange={(event) => setMake(event.target.value)} /></label><label>Model<input required value={model} onChange={(event) => setModel(event.target.value)} placeholder="Hilux 2.4 GD-6" /></label></div><div className="form-grid"><label>Branch<select value={selectedBranch} onChange={(event) => setSelectedBranch(event.target.value)}><option>Midrand</option><option>Centurion</option><option>Johannesburg</option><option>Cape Town</option></select></label><label>Asking price (ZAR)<input type="number" min="0" required value={price} onChange={(event) => setPrice(event.target.value)} /></label></div></>}{mode === "payment" && <><label>Customer<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Sipho Dlamini" /></label><label>Vehicle or deal<input required value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="e.g. Ford Ranger 2.2 XLS" /></label><div className="form-grid"><label>Amount (ZAR)<input type="number" min="0" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Method<select value={method} onChange={(event) => setMethod(event.target.value)}><option>EFT</option><option>Card</option><option>Cash</option></select></label></div></>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Icon name="check" size={16} /> Create record</button></div></form></Modal>;
}

function NotificationPopover({ navigate }: { navigate: (page: PageKey) => void }) { return <div className="popover notification-popover"><div className="popover-heading"><strong>Notifications</strong><span>6 unread</span></div><button onClick={() => navigate("attention")}><span className="notification-dot warning" /><span><strong>8 inspections overdue</strong><small>Across Midrand and Centurion · 12 min ago</small></span></button><button onClick={() => navigate("finance")}><span className="notification-dot critical" /><span><strong>Payment needs verification</strong><small>DPS10032 · 25 minutes ago</small></span></button><button onClick={() => navigate("deals")}><span className="notification-dot info" /><span><strong>Deal approval requested</strong><small>D-441 · 41 minutes ago</small></span></button><button className="popover-footer" onClick={() => navigate("attention")}>Open notification centre <Icon name="arrowRight" size={14} /></button></div>; }
function ProfilePopover({ onClose }: { onClose: () => void }) { return <div className="popover profile-popover"><div className="profile-popover-head"><span className="avatar">TM</span><span><strong>Thabo Mgidi</strong><small>Group manager</small></span></div><button onClick={onClose}><Icon name="user" size={16} /> My profile</button><button onClick={onClose}><Icon name="settings" size={16} /> Preferences</button><button onClick={onClose}><Icon name="logout" size={16} /> Sign out</button></div>; }

export default App;
