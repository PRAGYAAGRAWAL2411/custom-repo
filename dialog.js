let worksheetsMap = {};

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Tableau Extensions API for a dialog
    tableau.extensions.initializeDialogAsync().then((openPayload) => {
        buildWorksheetList();
        populateExistingSettings();

        // Worksheet selection changes -> update dimension/measure options
        document.getElementById('worksheetSelect').addEventListener('change', populateFields);
        
        // Save button listener
        document.getElementById('saveButton').addEventListener('click', saveSettings);
    });
});

function buildWorksheetList() {
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    const worksheetSelect = document.getElementById('worksheetSelect');

    worksheets.forEach(worksheet => {
        worksheetsMap[worksheet.name] = worksheet;
        let option = document.createElement('option');
        option.value = worksheet.name;
        option.text = worksheet.name;
        worksheetSelect.appendChild(option);
    });
}

function populateExistingSettings() {
    const settings = tableau.extensions.settings.getAll();
    if (settings.headerText) document.getElementById('headerText').value = settings.headerText;
    if (settings.targetUrl) document.getElementById('targetUrl').value = settings.targetUrl;
    if (settings.imageUrl) document.getElementById('imageUrl').value = settings.imageUrl;

    if (settings.selectedWorksheet) {
        document.getElementById('worksheetSelect').value = settings.selectedWorksheet;
        // Populate fields and set saved values
        populateFields().then(() => {
            if (settings.selectedDimension) document.getElementById('dimensionSelect').value = settings.selectedDimension;
            if (settings.selectedMeasure) document.getElementById('measureSelect').value = settings.selectedMeasure;
        });
    }
}

function populateFields() {
    const worksheetName = document.getElementById('worksheetSelect').value;
    const dimensionSelect = document.getElementById('dimensionSelect');
    const measureSelect = document.getElementById('measureSelect');
    
    // Clear existing
    dimensionSelect.innerHTML = '<option value="">-- Select Dimension --</option>';
    measureSelect.innerHTML = '<option value="">-- Select Measure --</option>';

    if (!worksheetName) return Promise.resolve();

    const worksheet = worksheetsMap[worksheetName];
    return worksheet.getSummaryDataAsync().then(dataTable => {
        dataTable.columns.forEach(column => {
            let option = document.createElement('option');
            option.value = column.fieldName;
            option.text = column.fieldName;
            
            // Basic heuristic: Is measure if it's numeric and not categorical
            // Tableau Extension API doesn't give a perfect boolean for dimension vs measure in getSummaryDataAsync, 
            // but we'll add them to both lists for flexibility or user knowledge.
            dimensionSelect.appendChild(option);
            
            let measureOption = document.createElement('option');
            measureOption.value = column.fieldName;
            measureOption.text = column.fieldName;
            measureSelect.appendChild(measureOption);
        });
    });
}

function saveSettings() {
    const headerText = document.getElementById('headerText').value;
    const targetUrl = document.getElementById('targetUrl').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const selectedWorksheet = document.getElementById('worksheetSelect').value;
    const selectedDimension = document.getElementById('dimensionSelect').value;
    const selectedMeasure = document.getElementById('measureSelect').value;

    tableau.extensions.settings.set('headerText', headerText);
    tableau.extensions.settings.set('targetUrl', targetUrl);
    tableau.extensions.settings.set('imageUrl', imageUrl);
    tableau.extensions.settings.set('selectedWorksheet', selectedWorksheet);
    tableau.extensions.settings.set('selectedDimension', selectedDimension);
    tableau.extensions.settings.set('selectedMeasure', selectedMeasure);

    tableau.extensions.settings.saveAsync().then(() => {
        // Close the dialog and pass a payload if needed
        tableau.extensions.ui.closeDialog("");
    });
}
