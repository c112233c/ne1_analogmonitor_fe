function formatNumber(value) {
    if (value == null) {
        return "-";
    }

    return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 2
    });
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
        date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AnalogSummary({ point, data }) {
    const validMin = (data || [])
        .map((item) => Number(item.min))
        .filter(Number.isFinite);

    const validMax = (data || [])
        .map((item) => Number(item.max))
        .filter(Number.isFinite);

    const validAvg = (data || [])
        .map((item) => Number(item.avg))
        .filter(Number.isFinite);

    const min = validMin.length ? Math.min(...validMin) : null;
    const max = validMax.length ? Math.max(...validMax) : null;
    const avg = validAvg.length
        ? validAvg.reduce((sum, value) => sum + value, 0) / validAvg.length
        : null;

    const unit = point?.unit || "";
    const latest = data?.[data.length - 1];

    return (
        <section className="summary card">
            <div>
                <div className="eyebrow">
                    {point?.bay || "-"} / {point?.type || "-"}
                </div>

                <div className="stats stats-large">
                    <div className="stat-min">
                        <span>Min</span>
                        <b>
                            {formatNumber(min)}
                            <small>{unit}</small>
                        </b>
                    </div>

                    <div className="stat-avg">
                        <span>Avg</span>
                        <b>
                            {formatNumber(avg)}
                            <small>{unit}</small>
                        </b>
                    </div>

                    <div className="stat-max">
                        <span>Max</span>
                        <b>
                            {formatNumber(max)}
                            <small>{unit}</small>
                        </b>
                    </div>
                </div>
            </div>

            <div className="update">
                Last update
                <br />
                <strong>{formatDateTime(latest?.date_time)}</strong>
            </div>
        </section>
    );
}
