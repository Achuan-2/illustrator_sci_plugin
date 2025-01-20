var csInterface = new CSInterface();

// UI Elements
var arrangeButton = document.querySelector("#arrange-button");
var addLabelButton = document.querySelector("#add-label-button");
var columnsInput = document.querySelector("#columns");
var rowGapInput = document.querySelector("#row-gap");
var colGapInput = document.querySelector("#col-gap");
var uniformWidthInput = document.querySelector("#uniform-width");
var uniformHeightInput = document.querySelector("#uniform-height");
var useUniformWidthCheckbox = document.querySelector("#use-uniform-width");
var useUniformHeightCheckbox = document.querySelector("#use-uniform-height");
var fontFamilyInput = document.querySelector("#font-family");
var fontSizeInput = document.querySelector("#font-size");
var labelOffsetXInput = document.querySelector("#label-offset-x");
var labelOffsetYInput = document.querySelector("#label-offset-y");
var labelTemplateSelect = document.querySelector("#label-template");

// Event Listeners
arrangeButton.addEventListener("click", handleArrange);
addLabelButton.addEventListener("click", handleAddLabel);

// Handler Functions
function handleArrange() {
    console.log("Arrange button clicked");
    var columns = parseInt(columnsInput.value) || 3;
    var rowGap = parseInt(rowGapInput.value) || 10;
    var colGap = parseInt(colGapInput.value) || 10;
    if (
        useUniformWidthCheckbox.checked &&
        parseFloat(uniformWidthInput.value) < 0
    ) {
        alert("Please specify a valid uniform width");
        return;
    }
    if (
        useUniformHeightCheckbox.checked &&
        parseFloat(uniformHeightInput.value) < 0
    ) {
        alert("Please specify a valid uniform height");
        return;
    }
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`
        arrangeImages(
            ${columns},
            ${rowGap},
            ${colGap},
            ${useUniformWidthCheckbox.checked},
            ${uniformWidthInput.value},
            ${useUniformHeightCheckbox.checked},
            ${uniformHeightInput.value}
        )
    `, function(result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}

function handleAddLabel() {
    var fontFamily = fontFamilyInput.value || "Arial";
    var fontSize = parseFloat(fontSizeInput.value) || 12;
    var labelOffsetX = parseFloat(labelOffsetXInput.value) || -12;
    var labelOffsetY = parseFloat(labelOffsetYInput.value) || -6;
    var labelTemplate = labelTemplateSelect.value || "A";

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`
        addLabelsToImages(
            "${fontFamily}",
            ${fontSize},
            ${labelOffsetX},
            ${labelOffsetY},
            "${labelTemplate}"
        )
    `, function (result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}
