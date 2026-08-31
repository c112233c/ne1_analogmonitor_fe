import { useEffect, useState } from "react";
import { getDetail } from "../api/analog";

const TYPES = ["P", "Q", "IA", "IB", "IC", "PF"];

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function csvValue(value) {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
}

function dateOnly(date) {
    return date.toISOString().slice(0, 10);
}

import "./AnalogDetailPage.css";

export default function AnalogDetailPage() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const [type, setType] = useState("P");
    const [from, setFrom] = useState(dateOnly(yesterday));
    const [to, setTo] = useState(dateOnly(today));
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        if (!from || !to) return;

        setLoading(true);
        setError("");

        try {
            const result = await getDetail(
                type,
                `${from} 00:00:00`,
                `${to} 23:59:59`
            );

            setRows(result.data || []);
        } catch (err) {
            setRows([]);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const exportCsv = () => {
        if (!rows.length) return;

        const header = [
            "Date Time",
            "Sub",
            "Bay",
            "Type",
            "Unit",
            "Min",
            "Avg",
            "Max"
        ];

        const body = rows.map((row) => [
            formatDate(row.date_time),
            row.sub,
            row.bay,
            row.type,
            row.unit,
            row.min,
            row.avg,
            row.max
        ]);

        const csv = [header, ...body]
            .map((line) => line.map(csvValue).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `analog-detail-${type}-${from}-${to}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <main className="detail-page">
            <header className="detail-header">
                <div>
                    <div className="brand">SCADA <span>ANALOG</span></div>
                    <h1>Analog Detail</h1>
                    <p>View the selected analog type across all Sub / Bay.</p>
                </div>

                <div className="detail-count">
                    <strong>{rows.length.toLocaleString()}</strong>
                    <span>records</span>
                </div>
            </header>

            <section className="detail-toolbar">
                <div className="detail-type-group">
                    <span className="detail-label">Analog Type</span>

                    <div className="detail-type-tabs">
                        {TYPES.map((item) => (
                            <button
                                key={item}
                                className={item === type ? "active" : ""}
                                onClick={() => setType(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="detail-date-group">
                    <label>
                        <span>From</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </label>

                    <span className="date-separator">—</span>

                    <label>
                        <span>To</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </label>

                    <button
                        className="detail-search"
                        onClick={load}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Search"}
                    </button>
                </div>
            </section>

            {error && <div className="error">{error}</div>}

            <section className="detail-table-card">
                <div className="detail-table-header">
                    <div>
                        <span className="detail-label">Historical Data</span>
                        <h2>{type} — All Sub / Bay</h2>
                    </div>

                    <button
                        className="export-button"
                        onClick={exportCsv}
                        disabled={!rows.length || loading}
                    >
                        Export CSV
                    </button>
                </div>

                <div className="detail-table-wrap">
                    <table className="detail-table">
                        <thead>
                            <tr>
                                <th>Date Time</th>
                                <th>Sub</th>
                                <th>Bay</th>
                                <th>Unit</th>
                                <th className="min-column">Min</th>
                                <th className="avg-column">Avg</th>
                                <th className="max-column">Max</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.sub}-${row.bay}-${row.date_time}-${index}`}>
                                    <td>{formatDate(row.date_time)}</td>
                                    <td className="sub-cell">{row.sub}</td>
                                    <td>{row.bay}</td>
                                    <td>{row.unit || "-"}</td>
                                    <td className="min-column">{row.min ?? "-"}</td>
                                    <td className="avg-column">{row.avg ?? "-"}</td>
                                    <td className="max-column">{row.max ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && !rows.length && (
                        <div className="detail-empty">
                            No data found for the selected analog type and date range.
                        </div>
                    )}

                    {loading && (
                        <div className="detail-empty">Loading data...</div>
                    )}
                </div>
            </section>
        </main>
    );
}
