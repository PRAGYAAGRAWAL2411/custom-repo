let pieChartInstance = null;

// Default colors matching the reference image
const chartColors = ['#1D4C9E', '#4B8BDE', '#A7C9F2', '#D3E3F8', '#E6F0FA'];

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Tableau Extensions API
    tableau.extensions.initializeAsync({'configure': configure}).then(() => {
        
        // Listen for settings updates from the config dialog
        tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
            updateExtensionState();
        });

        // Initial render
        updateExtensionState();
    });
});

function configure() {
    // Construct absolute URL for the dialog
    const url = window.location.href.replace('index.html', 'dialog.html');
    
    tableau.extensions.ui.displayDialogAsync(url, '', { height: 600, width: 500 }).then((closePayload) => {
        // The dialog was closed
        updateExtensionState();
    }).catch((error) => {
        // One possible error is that the user closed the dialog
        switch (error.errorCode) {
            case tableau.ErrorCodes.DialogClosedByUser:
                console.log("Dialog was closed by user");
                break;
            default:
                console.error(error.message);
        }
    });
}

function updateExtensionState() {
    const settings = tableau.extensions.settings.getAll();
    
    // Update Header
    if (settings.headerText) {
        document.getElementById('header-text').innerText = settings.headerText;
    }
    
    // Update Image
    const headerImage = document.getElementById('header-image');
    if (settings.imageUrl) {
        headerImage.src = settings.imageUrl;
        headerImage.style.display = 'inline-block';
    } else {
        headerImage.style.display = 'none';
    }
    
    // Update URL
    const headerLink = document.getElementById('header-link');
    if (settings.targetUrl) {
        headerLink.href = settings.targetUrl;
        headerLink.style.pointerEvents = 'auto';
    } else {
        headerLink.href = '#';
        headerLink.style.pointerEvents = 'none'; // Disable link if no URL
    }

    // Fetch data if worksheet is configured
    if (settings.selectedWorksheet && settings.selectedDimension && settings.selectedMeasure) {
        fetchDataAndRenderChart(settings.selectedWorksheet, settings.selectedDimension, settings.selectedMeasure);
    } else {
        // Render dummy data if not configured
        renderDummyData();
    }
}

function fetchDataAndRenderChart(worksheetName, dimensionName, measureName) {
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    const worksheet = worksheets.find(w => w.name === worksheetName);

    if (!worksheet) {
        console.error("Worksheet not found:", worksheetName);
        return;
    }

    worksheet.getSummaryDataAsync().then(dataTable => {
        const dimIndex = dataTable.columns.findIndex(c => c.fieldName === dimensionName);
        const mesIndex = dataTable.columns.findIndex(c => c.fieldName === measureName);

        if (dimIndex < 0 || mesIndex < 0) {
            console.error("Dimension or Measure not found in the worksheet data.");
            return;
        }

        let totalValue = 0;
        let dataMap = {};

        dataTable.data.forEach(row => {
            const dimValue = row[dimIndex].formattedValue;
            const mesValue = row[mesIndex].value;

            if (dataMap[dimValue]) {
                dataMap[dimValue] += mesValue;
            } else {
                dataMap[dimValue] = mesValue;
            }
            totalValue += mesValue;
        });

        // Format total value (e.g., 49,620)
        document.getElementById('total-value').innerText = totalValue.toLocaleString();

        const labels = Object.keys(dataMap);
        const values = Object.values(dataMap);

        renderChart(labels, values, totalValue);
    });
}

function renderDummyData() {
    // Setup dummy data to match reference image when not configured
    document.getElementById('total-value').innerText = "49,620";
    renderChart(["Spenders", "Prospects", "Prosp. spnd"], [29275, 13893, 6452], 49620);
}

function renderChart(labels, values, total) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    // Draw the chart
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: chartColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide default legend to use custom one
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    renderCustomLegend(labels, values, total);
}

function renderCustomLegend(labels, values, total) {
    const legendContainer = document.getElementById('chart-legend');
    legendContainer.innerHTML = ''; // clear existing

    labels.forEach((label, index) => {
        const val = values[index];
        const percentage = total > 0 ? Math.round((val / total) * 100) : 0;
        const color = chartColors[index % chartColors.length];

        const itemDiv = document.createElement('div');
        itemDiv.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        const textSpan = document.createElement('span');
        textSpan.innerText = `${label} ${percentage}%`;

        itemDiv.appendChild(colorBox);
        itemDiv.appendChild(textSpan);
        legendContainer.appendChild(itemDiv);
    });
}
