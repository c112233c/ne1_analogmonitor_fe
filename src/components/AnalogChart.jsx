import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

const fmt = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
        date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatValue = (value) =>
    Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 3
    });

export default function AnalogChart({ data, unit }) {
    if (!data?.length) {
        return (
            <div className="empty-chart">
                No historical data for this period
            </div>
        );
    }

    const chart = data.map((item) => ({
        ...item,
        date_label: fmt(item.date_time)
    }));

    return (
        <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={420}>
                <LineChart
                    data={chart}
                    margin={{
                        top: 10,
                        right: 18,
                        left: 4,
                        bottom: 8
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="date_label"
                        minTickGap={40}
                    />

                    <YAxis />

                    <Tooltip
                        formatter={(value, name) => [
                            formatValue(value),
                            name
                        ]}
                        labelFormatter={(value) => value}
                    />

                    <Legend />

                    <Line
                        type="monotone"
                        dataKey="min"
                        name="Min"
                        dot={false}
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                    />

                    <Line
                        type="monotone"
                        dataKey="avg"
                        name={`Avg${unit ? ` (${unit})` : ""}`}
                        dot={false}
                        stroke="#22c55e"
                        strokeWidth={3}
                    />

                    <Line
                        type="monotone"
                        dataKey="max"
                        name="Max"
                        dot={false}
                        stroke="#ef4444"
                        strokeWidth={1.5}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
