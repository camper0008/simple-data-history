async function updateChart(chart) {
    const data = await fetch("/api/live").then((x) => x.json());
    chart.data.labels = data.map((x) => new Date() - new Date(x.timestamp))
        .map((x) => `${Math.round(x / 1000)}s`);
    chart.data.datasets[0].data = data.map((x) => x.value);
    chart.update();
}

function main() {
    const ctx = document.getElementById("myChart");

    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Værdi læst",
                data: [],
                borderWidth: 1,
            }],
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
