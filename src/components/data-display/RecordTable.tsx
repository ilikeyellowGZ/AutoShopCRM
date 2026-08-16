import type { ReactNode } from "react";

export type RecordTableColumn<T> = { key: string; label: string; render: (record: T) => ReactNode; className?: string };

export function RecordTable<T extends { id: string }>({ columns, records, caption, emptyMessage = "No records to display." }: { columns: readonly RecordTableColumn<T>[]; records: readonly T[]; caption: string; emptyMessage?: string }) {
  return <div className="record-table-wrap"><table className="record-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col" className={column.className}>{column.label}</th>)}</tr></thead><tbody>{records.length ? records.map((record) => <tr key={record.id}>{columns.map((column) => <td key={column.key} className={column.className}>{column.render(record)}</td>)}</tr>) : <tr><td className="record-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody></table></div>;
}
