function fmtDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${
        pad(second)
    }`;
}

function pad(num) {
    if (num.toString().length < 2) {
        return `0${num}`;
    }
    return num.toString();
}

function mergeDateTime(date, time) {
    console.log(time);
    return `${date} ${time}`;
}

async function updateChart(chart, from, to) {
    const data = await fetch(`/api/history/${from}/${to}`)
        .then((x) => x.json());
    chart.data.labels = data.map((x) => new Date(x.timestamp)).map(fmtDate);
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
                        text: "Læst ved",
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

    const now = new Date();
    const nowFmt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${
        pad(now.getDate())
    }`;

    const fromInput = document.querySelector("#from");
    if (fromInput.value === "") {
        fromInput.value = nowFmt;
    }
    const toInput = document.querySelector("#to");
    if (toInput.value === "") {
        toInput.value = nowFmt;
    }
    const fromTimeInput = document.querySelector("#fromTime");
    const toTimeInput = document.querySelector("#toTime");
    const retrieveButton = document.querySelector("#retrieve");

    updateChart(
        chart,
        mergeDateTime(fromInput.value, fromTimeInput.value),
        mergeDateTime(toInput.value, toTimeInput.value),
    );

    retrieveButton.addEventListener("click", () => {
        updateChart(
            chart,
            mergeDateTime(fromInput.value, fromTimeInput.value),
            mergeDateTime(toInput.value, toTimeInput.value),
        );
    });
}

main();
