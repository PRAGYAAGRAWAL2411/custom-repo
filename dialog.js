document.addEventListener("DOMContentLoaded", () => {
    tableau.extensions.initializeDialogAsync().then((openPayload) => {
        populateFields().then(() => {
            populateExistingSettings();
        });

        document.getElementById('saveButton').addEventListener('click', saveSettings);
    });
});

function populateExistingSettings() {
    const settings = tableau.extensions.settings.getAll();
    if (settings.headerText) document.getElementById('headerText').value = settings.headerText;
    if (settings.targetUrl) document.getElementById('targetUrl').value = settings.targetUrl;
    if (settings.imageUrl) document.getElementById('imageUrl').value = settings.imageUrl;

    if (settings.selectedDimension) document.getElementById('dimensionSelect').value = settings.selectedDimension;
    if (settings.selectedMeasure) document.getElementById('measureSelect').value = settings.selectedMeasure;
}

function populateFields() {
    const dimensionSelect = document.getElementById('dimensionSelect');
    const measureSelect = document.getElementById('measureSelect');
    
    dimensionSelect.innerHTML = '<option value="">-- Select Dimension --</option>';
    measureSelect.innerHTML = '<option value="">-- Select Measure --</option>';

    // For a Viz Extension, the host worksheet is available directly
    const worksheet = tableau.extensions.worksheetContent.worksheet;
    
    if (!worksheet) return Promise.resolve();

    return worksheet.getSummaryDataAsync().then(dataTable => {
        dataTable.columns.forEach(column => {
            let option = document.createElement('option');
            option.value = column.fieldName;
            option.text = column.fieldName;
            dimensionSelect.appendChild(option);
            
            let measureOption = document.createElement('option');
            measureOption.value = column.fieldName;
            measureOption.text = column.fieldName;
            measureSelect.appendChild(measureOption);
        });
    }).catch(err => {
        console.log("Could not get summary data. Make sure fields are added to the Marks card.", err);
    });
}

function saveSettings() {
    const headerText = document.getElementById('headerText').value;
    const targetUrl = document.getElementById('targetUrl').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const selectedDimension = document.getElementById('dimensionSelect').value;
    const selectedMeasure = document.getElementById('measureSelect').value;

    tableau.extensions.settings.set('headerText', headerText);
    tableau.extensions.settings.set('targetUrl', targetUrl);
    tableau.extensions.settings.set('imageUrl', imageUrl);
    tableau.extensions.settings.set('selectedDimension', selectedDimension);
    tableau.extensions.settings.set('selectedMeasure', selectedMeasure);

    tableau.extensions.settings.saveAsync().then(() => {
        tableau.extensions.ui.closeDialog("");
    });
}
