var csInterface = new CSInterface();

// UI Elements
var arrangeButton = document.querySelector("#arrange-button");
var addLabelButton = document.querySelector("#add-label-button");
var copyPosButton = document.querySelector("#copy-pos-button");
var pastePosButton = document.querySelector("#paste-pos-button");
var negatePosButton = document.querySelector("#negate-pos-button");
var reverseMoveCheckbox = document.querySelector("#reverse-move-checkbox");
var relativeCornerSelect = document.querySelector("#relative-corner");
var deltaXInput = document.querySelector("#delta-x");
var deltaYInput = document.querySelector("#delta-y");
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
copyPosButton.addEventListener("click", handleCopyPosition);
pastePosButton.addEventListener("click", handlePastePosition);
negatePosButton.addEventListener("click", handleNegatePosition);

// Handler Functions
function handleCopyPosition() {
    console.log("Copy Position button clicked");
    var corner = relativeCornerSelect.value;
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`copyRelativePosition("${corner}")`, function(result) {
        if (result && result !== 'EvalScript error.') {
            var parts = result.split(',');
            if (parts.length === 2) {
                deltaXInput.value = parseFloat(parts[0]).toFixed(2);
                deltaYInput.value = parseFloat(parts[1]).toFixed(2);
            }
        } else if (result.includes("Error:")) {
            alert(result);
        }
    });
}

function handlePastePosition() {
    console.log("Paste Position button clicked");
    var deltaX = parseFloat(deltaXInput.value) || 0;
    var deltaY = parseFloat(deltaYInput.value) || 0;
    var reverse = reverseMoveCheckbox.checked;
    var corner = relativeCornerSelect.value;
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`pasteRelativePosition(${deltaX}, ${deltaY}, ${reverse}, "${corner}")`, function(result) {
        if (result && result.includes("Error:")) {
            alert(result);
        }
    });
}

function handleNegatePosition(){
    deltaXInput.value = -parseFloat(deltaXInput.value);
    deltaYInput.value = -parseFloat(deltaYInput.value);
}

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
