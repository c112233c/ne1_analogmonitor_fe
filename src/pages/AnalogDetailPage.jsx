import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDetail, getStations } from "../api/analog";

const TYPES = ["P", "Q", "IA", "IB", "IC", "PF"];

function formatDate(value) {
    if (!value) return value;

    // MySQL DATETIME is returned as a string to avoid timezone conversion.
    const match = String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (match) {
        return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
    }

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

function parseDate(value) {
    return value ? new Date(`${value}T00:00:00`) : null;
}

function formatInputDate(date) {
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

import "./AnalogDetailPage.css";

export default function AnalogDetailPage() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const [type, setType] = useState("P");
    const [station, setStation] = useState("");
    const [stations, setStations] = useState([]);
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
            const endDate = new Date(`${to}T00:00:00`);
            endDate.setDate(endDate.getDate() + 1);
            const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
            const result = await getDetail(type, `${from} 00:00:00`, `${endDateString} 00:00:00`, station);
            setRows(result.data || []);
        } catch (err) {
            setRows([]);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStations()
            .then((result) => {
                const list = result.data || result || [];
                setStations(list);
                if (list.length) {
                    const first = typeof list[0] === "string" ? list[0] : (list[0].sub || list[0].station || list[0].code);
                    if (first) setStation(first);
                }
            })
            .catch(() => setStations([]));
    }, []);

    useEffect(() => {
        if (stations.length && station) load();
    }, [station]);

    const formatCsvDate = (value) => {
        if (!value) return "";
        const match = String(value).match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})/);
        if (match) return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
        return formatDate(value).replace(/\s?(AM|PM)$/i, "");
    };

    const exportCsv = () => {
        if (!rows.length) return;
        const header = ["Date Time", "Sub", "Bay", "Type", "Unit", "Min", "Avg", "Max"];
        const body = rows.map((row) => [formatCsvDate(row.date_time), row.sub, row.bay, row.type, row.unit, row.min, row.avg, row.max]);
        const csv = [header, ...body].map((line) => line.map(csvValue).join(",")).join("\r\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
                <div><div className="brand">SCADA <span>ANALOG</span></div><h1>Analog Detail</h1><p>View the selected analog type across all Sub / Bay.</p></div>
                <div className="detail-count"><strong>{rows.length.toLocaleString()}</strong><span>records</span></div>
            </header>

            <section className="detail-toolbar">
                <div className="detail-type-group">
                    <span className="detail-label">Analog Type</span>
                    <div className="detail-type-tabs">{TYPES.map((item) => <button key={item} className={item === type ? "active" : ""} onClick={() => setType(item)}>{item}</button>)}</div>
                </div>

                <div className="detail-station-group">
                    <label className="station-select-label">
                        <span>Station</span>
                        <div className="station-select-wrap">
                            <span className="station-icon" aria-hidden="true">⌖</span>
                            <select value={station} onChange={(event) => setStation(event.target.value)}>
                                {["", ...stations].map((item, index) => {
                                    if (index === 0) return <option key="all" value="">All Stations</option>;
                                    const value = typeof item === "string" ? item : (item.sub || item.station || item.code);
                                    return value ? <option key={value} value={value}>{value}</option> : null;
                                })}
                            </select>
                        </div>
                    </label>
                </div>

                <div className="detail-date-group">
                    <label><span>From</span><DatePicker selected={parseDate(from)} onChange={(date) => setFrom(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" /></label>
                    <span className="date-separator">—</span>
                    <label><span>To</span><DatePicker selected={parseDate(to)} onChange={(date) => setTo(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" /></label>
                    <button className="detail-search" onClick={load} disabled={loading}>{loading ? "Loading..." : "Search"}</button>
                </div>
            </section>

            {error && <div className="error">{error}</div>}
            <section className="detail-table-card">
                <div className="detail-table-header"><div><span className="detail-label">Historical Data</span><h2>{type} — {station || "All Sub / Bay"}</h2></div><button className="export-button" onClick={exportCsv} disabled={!rows.length || loading}>Export CSV</button></div>
                <div className="detail-table-wrap">
                    <table className="detail-table"><thead><tr><th>Date Time</th><th>Sub</th><th>Bay</th><th>Unit</th><th className="min-column">Min</th><th className="avg-column">Avg</th><th className="max-column">Max</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.sub}-${row.bay}-${row.date_time}-${index}`}><td>{formatDate(row.date_time)}</td><td className="sub-cell">{row.sub}</td><td>{row.bay}</td><td>{row.unit || "-"}</td><td className="min-column">{row.min ?? "-"}</td><td className="avg-column">{row.avg ?? "-"}</td><td className="max-column">{row.max ?? "-"}</td></tr>)}</tbody></table>
                    {!loading && !rows.length && <div className="detail-empty">No data found for the selected analog type and date range.</div>}
                    {loading && <div className="detail-loading" role="status" aria-live="polite"><div className="detail-spinner" aria-hidden="true" /><div><strong>Loading data...</strong><span>Fetching analog history</span></div></div>}
                </div>
            </section>
        </main>
    );
}
