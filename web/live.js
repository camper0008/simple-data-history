async function updateChart(chart) {
    const data = await fetch("/api/live").then((x) => x.json());
    chart.data.labels = data.filter((x) => x.type === 0).map((x) =>
        new Date() - new Date(x.timestamp)
    )
        .map((x) => `${Math.round(x / 1000)}s`);
    const minType = data.map((x) => x.type).reduce(
        (acc, x) => Math.min(acc, x),
        Infinity,
    );
    const maxType = data.map((x) => x.type).reduce(
        (acc, x) => Math.max(acc, x),
        -Infinity,
    );
    for (let i = minType; i <= maxType; ++i) {
        chart.data.datasets[i].data = data
            .filter((x) => x.type === i)
            .map((x) => x.value);
    }
    chart.update();
}

function main() {
    const ctx = document.getElementById("myChart");

    const chart = new Chart(ctx, {
        data: {
            labels: [],
            datasets: [
                {
                    type: "line",
                    label: "Forurening",
                    data: [],
                    borderWidth: 1,
                },
                {
                    type: "line",
                    label: "Vindretning",
                    data: [],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Sekunder siden læst",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Værdi læst",
                    },
                    beginAtZero: true,
                },
            },
        },
    });

    updateChart(chart);

    setInterval(() => updateChart(chart), 1000);
}

main();
