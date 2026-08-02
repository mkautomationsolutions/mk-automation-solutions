const supabaseClient =
    window.mkSupabase;


const totalLeadsElement =
    document.getElementById(
        "analytics-total-leads"
    );

const convertedLeadsElement =
    document.getElementById(
        "analytics-converted-leads"
    );

const conversionRateElement =
    document.getElementById(
        "analytics-conversion-rate"
    );

const followUpsElement =
    document.getElementById(
        "analytics-followups"
    );

const analyticsMessage =
    document.getElementById(
        "analytics-message"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );


let analyticsLeads = [];

let statusChart = null;

let serviceChart = null;

let trendChart = null;


function formatLabel(value) {

    if (!value) {
        return "Unknown";
    }


    return String(value)
        .replaceAll("-", " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function normaliseStatus(value) {

    return String(
        value || "new"
    )
        .toLowerCase()
        .trim();

}


function updateAnalyticsCards() {

    const totalLeads =
        analyticsLeads.length;


    const convertedLeads =
        analyticsLeads.filter(
            lead =>
                normaliseStatus(
                    lead.status
                ) === "converted"
        ).length;


    const scheduledFollowUps =
        analyticsLeads.filter(
            lead =>
                Boolean(
                    lead.follow_up_at
                )
        ).length;


    const conversionRate =
        totalLeads > 0
            ? (
                convertedLeads /
                totalLeads *
                100
            ).toFixed(1)
            : "0.0";


    totalLeadsElement.textContent =
        totalLeads;


    convertedLeadsElement.textContent =
        convertedLeads;


    conversionRateElement.textContent =
        `${conversionRate}%`;


    followUpsElement.textContent =
        scheduledFollowUps;

}


function buildStatusData() {

    const counts = {};


    analyticsLeads.forEach((lead) => {

        const status =
            normaliseStatus(
                lead.status
            );


        counts[status] =
            (counts[status] || 0) + 1;

    });


    return {

        labels:
            Object.keys(counts)
                .map(formatLabel),

        values:
            Object.values(counts)

    };

}


function buildServiceData() {

    const counts = {};


    analyticsLeads.forEach((lead) => {

        const service =
            String(
                lead.service ||
                "unknown"
            )
                .toLowerCase()
                .trim();


        counts[service] =
            (counts[service] || 0) + 1;

    });


    const sortedEntries =
        Object.entries(counts)
            .sort(
                (firstEntry, secondEntry) =>
                    secondEntry[1] -
                    firstEntry[1]
            );


    return {

        labels:
            sortedEntries.map(
                entry =>
                    formatLabel(entry[0])
            ),

        values:
            sortedEntries.map(
                entry =>
                    entry[1]
            )

    };

}


function getLocalDateKey(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function buildSevenDayTrend() {

    const labels = [];

    const keys = [];

    const values = [];

    const counts = {};


    for (
        let dayOffset = 6;
        dayOffset >= 0;
        dayOffset -= 1
    ) {

        const date =
            new Date();

        date.setHours(
            0,
            0,
            0,
            0
        );

        date.setDate(
            date.getDate() -
            dayOffset
        );


        const key =
            getLocalDateKey(date);


        keys.push(key);


        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short"
                }
            )
        );


        counts[key] = 0;

    }


    analyticsLeads.forEach((lead) => {

        if (!lead.created_at) {
            return;
        }


        const createdDate =
            new Date(
                lead.created_at
            );


        if (
            Number.isNaN(
                createdDate.getTime()
            )
        ) {
            return;
        }


        const key =
            getLocalDateKey(
                createdDate
            );


        if (
            Object.prototype
                .hasOwnProperty
                .call(counts, key)
        ) {

            counts[key] += 1;

        }

    });


    keys.forEach((key) => {

        values.push(
            counts[key]
        );

    });


    return {
        labels,
        values
    };

}


function createStatusChart() {

    const chartData =
        buildStatusData();


    if (statusChart) {
        statusChart.destroy();
    }


    statusChart =
        new Chart(
            document.getElementById(
                "status-chart"
            ),
            {
                type: "doughnut",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [
                        {
                            data:
                                chartData.values,

                            backgroundColor: [
                                "#2563eb",
                                "#f59e0b",
                                "#10b981",
                                "#ef4444",
                                "#8b5cf6",
                                "#06b6d4"
                            ],

                            borderWidth: 0,

                            hoverOffset: 8
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "67%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                usePointStyle: true,

                                padding: 18,

                                font: {
                                    family: "Poppins"
                                }

                            }

                        }

                    }

                }

            }
        );

}


function createServiceChart() {

    const chartData =
        buildServiceData();


    if (serviceChart) {
        serviceChart.destroy();
    }


    serviceChart =
        new Chart(
            document.getElementById(
                "service-chart"
            ),
            {
                type: "bar",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [
                        {
                            label: "Leads",

                            data:
                                chartData.values,

                            backgroundColor:
                                "#2563eb",

                            borderRadius: 8,

                            borderSkipped: false
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    indexAxis: "y",

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            },

                            grid: {
                                color:
                                    "rgba(148, 163, 184, 0.18)"
                            }

                        },

                        y: {

                            grid: {
                                display: false
                            }

                        }

                    }

                }

            }
        );

}


function createTrendChart() {

    const chartData =
        buildSevenDayTrend();


    if (trendChart) {
        trendChart.destroy();
    }


    trendChart =
        new Chart(
            document.getElementById(
                "trend-chart"
            ),
            {
                type: "line",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [
                        {
                            label:
                                "Leads Received",

                            data:
                                chartData.values,

                            borderColor:
                                "#2563eb",

                            backgroundColor:
                                "rgba(37, 99, 235, 0.12)",

                            fill: true,

                            tension: 0.35,

                            pointRadius: 5,

                            pointHoverRadius: 7,

                            pointBackgroundColor:
                                "#2563eb"
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            },

                            grid: {
                                color:
                                    "rgba(148, 163, 184, 0.18)"
                            }

                        },

                        x: {

                            grid: {
                                display: false
                            }

                        }

                    }

                }

            }
        );

}


function renderAnalytics() {

    updateAnalyticsCards();

    createStatusChart();

    createServiceChart();

    createTrendChart();

}


async function protectAnalyticsPage() {

    const {
        data: { session }
    } =
        await supabaseClient.auth
            .getSession();


    if (!session) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


async function loadAnalytics() {

    analyticsMessage.textContent =
        "Loading analytics...";


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select(`
                id,
                status,
                service,
                created_at,
                follow_up_at
            `)
            .eq(
    "is_archived",
    false
)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Unable to load analytics:",
            error
        );


        analyticsMessage.textContent =
            `${error.code || "ERROR"}: ${error.message}`;


        analyticsMessage.style.color =
            "#dc2626";


        return;

    }


    analyticsLeads =
        data ?? [];


    renderAnalytics();


    analyticsMessage.textContent =
        analyticsLeads.length > 0
            ? "Analytics updated successfully."
            : "No lead data is available yet.";


    analyticsMessage.style.color =
        "#047857";

}


logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth
            .signOut();


        window.location.href =
            "login.html";

    }
);


async function initialiseAnalytics() {

    const isAuthenticated =
        await protectAnalyticsPage();


    if (!isAuthenticated) {
        return;
    }
 await window.loadAndApplyCrmSettings();

    await loadAnalytics();

}


initialiseAnalytics()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });