import type { Deal, DemoState } from "../../domain/models";

const safeCell = (value: string | number) => {
  const raw = String(value);
  const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(formulaSafe) ? `"${formulaSafe.replace(/"/g, '""')}"` : formulaSafe;
};

export function exportSalesCsv(deals: readonly Deal[], state: DemoState): string {
  const vehicleById = new Map(state.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const header = ["Date", "Vehicle", "VIN", "Sales Rep", "Gross Profit", "Status"];
  const rows = deals.map((deal) => {
    const vehicle = vehicleById.get(deal.vehicleId);
    return [
      deal.date.slice(0, 10),
      vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}` : "Unknown vehicle",
      vehicle?.vin ?? "",
      deal.salesRep,
      deal.grossProfit.toFixed(2),
      deal.status,
    ].map(safeCell).join(",");
  });
  return [header.join(","), ...rows].join("\n");
}
