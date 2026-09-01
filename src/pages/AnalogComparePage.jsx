import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { getBays, getHistory, getPoints, getStations } from "../api/analog";

const day = (date) => date.toISOString().slice(0, 10);

const METRICS = [
    { key: "min", label: "Min" },
    { key: "avg", label: "Avg" },
    { key: "max", label: "Max" }
];

const COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#db2777",
    "#65a30d"
];

function parseDate(value) {
    return value ? new Date(`${value}T00:00:00`) : null;
}

function formatInputDate(date) {
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
    const date = new Date(value);
    const pad = (number) => String(number).padStart(2, "0");

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
        date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AnalogComparePage() {
    const now = new Date();
    const previous = new Date(now);
    previous.setDate(now.getDate() - 1);

    const [stations, setStations] = useState([]);
    const [bays, setBays] = useState([]);
    const [points, setPoints] = useState([]);
    const [type, setType] = useState("");
    const [station, setStation] = useState("");
    const [bay, setBay] = useState("");
    const [selected, setSelected] = useState([]);
    const [from, setFrom] = useState(day(previous));
    const [to, setTo] = useState(day(now));
    const [visibleMetrics, setVisibleMetrics] = useState({
        min: true,
        avg: true,
        max: true
    });
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getStations()
            .then(setStations)
            .catch((error) => setError(error.message));
    }, []);

    useEffect(() => {
        setStation("");
        setBay("");
        setBays([]);
        setPoints([]);
        setSelected([]);
        setSeries([]);

        if (!type) {
            return;
        }
    }, [type]);

    useEffect(() => {
        setBay("");
        setBays([]);
        setPoints([]);

        if (!station) {
            return;
        }

        getBays(station)
            .then(setBays)
            .catch((error) => setError(error.message));
    }, [station]);

    useEffect(() => {
        setPoints([]);

        if (!station || !bay || !type) {
            return;
        }

        getPoints(station, bay)
            .then((data) => setPoints(data.filter((point) => point.type === type)))
            .catch((error) => setError(error.message));
    }, [station, bay, type]);

    const MAX_POINTS = 10;

    const availablePoints = points.filter(
        (point) => !selected.some((item) => item.gid === point.gid)
    );

    const canAddPoint = selected.length < MAX_POINTS;

    const addPoint = (gid) => {
        if (!canAddPoint) {
            return;
        }

        const point = points.find((item) => item.gid === gid);

        if (point) {
            setSelected((current) => {
                if (current.length >= MAX_POINTS) {
                    return current;
                }

                return [...current, point];
            });
        }
    };

    const removePoint = (gid) => {
        setSelected((current) => current.filter((point) => point.gid !== gid));
        setSeries((current) => current.filter((item) => item.point.gid !== gid));
    };

    const toggleMetric = (key) => {
        setVisibleMetrics((current) => ({
            ...current,
            [key]: !current[key]
        }));
    };

    const load = async () => {
        if (!selected.length) {
            setError("Add at least one analog point to compare");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const results = await Promise.all(
                selected.map(async (point) => {
                    const result = await getHistory(
                        point.gid,
                        `${from} 00:00:00`,
                        `${to} 23:59:59`
                    );

                    return {
                        point: result.point || point,
                        data: result.data || []
                    };
                })
            );

            setSeries(results);
        } catch (error) {
            setError(error.message);
            setSeries([]);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        const rows = new Map();

        series.forEach(({ point, data }) => {
            data.forEach((item) => {
                const key = item.date_time;
                const row = rows.get(key) || { date_time: key };

                METRICS.forEach(({ key: metric }) => {
                    row[`${point.gid}_${metric}`] = item[metric];
                });

                rows.set(key, row);
            });
        });

        return [...rows.values()].sort(
            (a, b) => new Date(a.date_time) - new Date(b.date_time)
        );
    }, [series]);

    return (
        <main className="app-shell">
            <header className="topbar">
                <div>
                    <div className="brand">
                        SCADA <span>ANALOG</span>
                    </div>
                    <h1>Compare Analog</h1>
                    <p>Compare the same analog type over the same time range</p>
                </div>
            </header>

            <section className="card controls">
                <div className="compare-filter-row">
                    <label className="field">
                        <span>Analog Type</span>
                        <select value={type} onChange={(event) => setType(event.target.value)}>
                            <option value="">Select analog type</option>
                            <option value="P">P</option>
                            <option value="Q">Q</option>
                            <option value="IA">IA</option>
                            <option value="IB">IB</option>
                            <option value="IC">IC</option>
                            <option value="PF">PF</option>
                        </select>
                    </label>

                    <label className="field">
                        <span>From</span>
                        <DatePicker selected={parseDate(from)} onChange={(date) => setFrom(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" />
                    </label>

                    <label className="field">
                        <span>To</span>
                        <DatePicker selected={parseDate(to)} onChange={(date) => setTo(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" />
                    </label>
                </div>
            </section>

            {error && <div className="error">{error}</div>}

            <section className="card compare-selection">
                <div className="section-head">
                    <div>
                        <div className="eyebrow">Select point</div>
                        <h2>Add {type || "analog"} point</h2>
                    </div>
                </div>

                <div className="compare-add-row">
                    <label className="field">
                        <span>Station</span>
                        <select
                            value={station}
                            onChange={(event) => setStation(event.target.value)}
                            disabled={!type}
                        >
                            <option value="">Select station</option>
                            {stations.map((item) => (
                                <option key={item.sub} value={item.sub}>
                                    {item.sub}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>Bay</span>
                        <select
                            value={bay}
                            onChange={(event) => setBay(event.target.value)}
                            disabled={!station}
                        >
                            <option value="">Select bay</option>
                            {bays.map((item) => (
                                <option key={item.bay} value={item.bay}>
                                    {item.bay}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field point-select">
                        <span>Point ({selected.length}/{MAX_POINTS})</span>
                        <select
                            value=""
                            onChange={(event) => addPoint(event.target.value)}
                            disabled={!bay || !availablePoints.length || !canAddPoint}
                        >
                            <option value="">Select point to add</option>
                            {availablePoints.map((point) => (
                                <option key={point.gid} value={point.gid}>
                                    {point.gid} — {point.sub} / {point.bay} / {point.type}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="point-limit-message">
                        {canAddPoint
                            ? `Add up to ${MAX_POINTS} points for comparison (${MAX_POINTS - selected.length} remaining).`
                            : `Maximum ${MAX_POINTS} points reached. Remove a point to add another.`}
                    </div>
                </div>

                <div className="compare-points">
                    {selected.map((point) => (
                        <div className="compare-point" key={point.gid}>
                            <span>{point.sub} / {point.bay} / {point.type}</span>
                            <strong>{point.gid}</strong>
                            <small>{point.unit || "No unit"}</small>
                            <button onClick={() => removePoint(point.gid)} aria-label={`Remove ${point.gid}`}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div className="compare-actions">
                    <div className="metric-toggles">
                        {METRICS.map((metric) => (
                            <button
                                key={metric.key}
                                className={
                                    visibleMetrics[metric.key]
                                        ? `metric-toggle active ${metric.key}`
                                        : "metric-toggle"
                                }
                                onClick={() => toggleMetric(metric.key)}
                            >
                                <span className={`metric-line ${metric.key}`} aria-hidden="true" />
                                {metric.label}
                            </button>
                        ))}
                    </div>

                    <button className="search" disabled={!selected.length || loading} onClick={load}>
                        {loading ? "Loading..." : "Compare"}
                    </button>
                </div>
            </section>

            {series.length > 0 && (
                <section className="card chart-card">
                    <div className="section-head">
                        <div>
                            <div className="eyebrow">Historical comparison</div>
                            <h2>Analog Type: {type}</h2>
                        </div>
                        <span className="sample-count">{selected.length} analog points</span>
                    </div>

                    <div className="compare-legend">
                        {series.map(({ point }, index) => (
                            <span key={point.gid}>
                                <i style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {point.sub} / {point.bay} / {point.gid}
                            </span>
                        ))}
                    </div>

                    <ResponsiveContainer width="100%" height={500}>
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 18, left: 4, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date_time"
                                tickFormatter={formatDate}
                                minTickGap={40}
                            />
                            <YAxis />
                            <Tooltip labelFormatter={formatDate} />
                            <Legend />

                            {series.map(({ point }, index) => {
                                const color = COLORS[index % COLORS.length];

                                return METRICS
                                    .filter((metric) => visibleMetrics[metric.key])
                                    .map((metric) => (
                                        <Line
                                            key={`${point.gid}-${metric.key}`}
                                            type="monotone"
                                            dataKey={`${point.gid}_${metric.key}`}
                                            name={`${point.sub}/${point.bay} ${metric.label}`}
                                            dot={false}
                                            stroke={color}
                                            strokeWidth={metric.key === "avg" ? 2.5 : 1.2}
                                            strokeDasharray={
                                                metric.key === "min"
                                                    ? "5 3"
                                                    : metric.key === "avg"
                                                        ? "1 4"
                                                        : undefined
                                            }
                                        />
                                    ));
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </section>
            )}
        </main>
    );
}
