var csInterface = new CSInterface();

// UI Elements
var arrangeButton = document.querySelector("#arrange-button");
var addLabelButton = document.querySelector("#add-label-button");
var copyPosButton = document.querySelector("#copy-pos-button");
var pastePosButton = document.querySelector("#paste-pos-button");

var reverseMoveCheckbox = document.querySelector("#reverse-move-checkbox");
var relativeCornerSelect = document.querySelector("#relative-corner");
var deltaXInput = document.querySelector("#delta-x");
var deltaYInput = document.querySelector("#delta-y");
var copiedDeltasJSON = '[]';

// New: Relative order controls
var relativeOrderSelect = document.querySelector("#relative-order");
// merged into reverseMoveCheckbox

var columnsInput = document.querySelector("#columns");
var rowGapInput = document.querySelector("#row-gap");
var colGapInput = document.querySelector("#col-gap");
var uniformWidthInput = document.querySelector("#uniform-width");
var uniformHeightInput = document.querySelector("#uniform-height");
var useUniformWidthCheckbox = document.querySelector("#use-uniform-width");
var useUniformHeightCheckbox = document.querySelector("#use-uniform-height");

// New: Arrange order controls
var arrangeOrderSelect = document.querySelector("#arrange-order");
var arrangeReverseOrderCheckbox = document.querySelector("#arrange-reverse-order");

var fontFamilyInput = document.querySelector("#font-family");
var fontSizeInput = document.querySelector("#font-size");
var labelOffsetXInput = document.querySelector("#label-offset-x");
var labelOffsetYInput = document.querySelector("#label-offset-y");
var labelTemplateSelect = document.querySelector("#label-template");

// New: Labels order controls
var labelsOrderSelect = document.querySelector("#labels-order");
var labelsReverseOrderCheckbox = document.querySelector("#labels-reverse-order");

// Size Formater UI Elements
var sizeWInput = document.querySelector("#size-w");
var sizeHInput = document.querySelector("#size-h");
var copySizeButton = document.querySelector("#copy-size-button");
var pasteSizeButton = document.querySelector("#paste-size-button");
var useSizeWCheckbox = document.querySelector("#use-size-w");
var useSizeHCheckbox = document.querySelector("#use-size-h");

// Event Listeners
arrangeButton.addEventListener("click", handleArrange);
addLabelButton.addEventListener("click", handleAddLabel);
copyPosButton.addEventListener("click", handleCopyPosition);
pastePosButton.addEventListener("click", handlePastePosition);

copySizeButton.addEventListener("click", handleCopySize);
pasteSizeButton.addEventListener("click", handlePasteSize);

// Handler Functions
function handleCopyPosition() {
    console.log("Copy Position button clicked");
    var corner = relativeCornerSelect.value;
    var order = (relativeOrderSelect && relativeOrderSelect.value) || "stacking";
    var revOrder = !!reverseMoveCheckbox.checked;

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`copyRelativePosition("${corner}", "${order}", ${revOrder})`, function (result) {
        deltaXInput.placeholder = 'ΔX'; // Reset placeholder
        deltaYInput.placeholder = 'ΔY';

        if (result && result.indexOf("Error:") === 0) {
            alert(result);
            return;
        }

        if (result && result !== 'EvalScript error.') {
            copiedDeltasJSON = result; // Store the raw JSON string
            try {
                // In ExtendScript, we're now using eval, which gives us an object directly.
                var deltas = eval('(' + result + ')');
                if (deltas && deltas.length === 1) {
                    deltaXInput.value = parseFloat(deltas[0].deltaX).toFixed(2);
                    deltaYInput.value = parseFloat(deltas[0].deltaY).toFixed(2);
                } else if (deltas && deltas.length > 1) {
                    deltaXInput.value = ''; // Clear the input
                    deltaYInput.value = '';
                    deltaXInput.placeholder = 'Multiple Values';
                    deltaYInput.placeholder = 'Multiple Values';
                } else {
                    deltaXInput.value = '0.00';
                    deltaYInput.value = '0.00';
                }
            } catch (e) {
                alert("Failed to parse position data: " + e.message);
                copiedDeltasJSON = '[]';
                deltaXInput.value = '0.00';
                deltaYInput.value = '0.00';
            }
        }
    });
}

function handlePastePosition() {
    console.log("Paste Position button clicked");

    var deltaXStr = deltaXInput.value.trim();
    var deltaYStr = deltaYInput.value.trim();
    var overrideDeltaX = null;
    var overrideDeltaY = null;

    // Use override if inputs are not empty strings. This allows '0' to be a valid override.
    var useOverride = deltaXStr !== '' && deltaYStr !== '';

    if (useOverride) {
        overrideDeltaX = parseFloat(deltaXStr);
        overrideDeltaY = parseFloat(deltaYStr);
        if (isNaN(overrideDeltaX) || isNaN(overrideDeltaY)) {
            alert("Invalid number format for ΔX or ΔY.");
            return;
        }
    } else if (!copiedDeltasJSON || copiedDeltasJSON === '[]') {
        alert("No position data has been copied, and no override values are set.");
        return;
    }

    var reverse = !!reverseMoveCheckbox.checked;
    var corner = relativeCornerSelect.value;
    var order = (relativeOrderSelect && relativeOrderSelect.value) || "stacking";
    var revOrder = !!reverseMoveCheckbox.checked;

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);

    var script = `pasteRelativePosition('${copiedDeltasJSON}', ${reverse}, "${corner}", "${order}", ${revOrder}, ${useOverride ? overrideDeltaX : 'null'}, ${useOverride ? overrideDeltaY : 'null'})`;
    csInterface.evalScript(script, function (result) {
        if (result && result.indexOf("Error:") === 0) {
            alert(result);
        }
    });
}


function handleArrange() {
    console.log("Arrange button clicked");
    var columns = parseInt(columnsInput.value) || 3;
    var rowGap = parseFloat(rowGapInput.value) || 10;
    var colGap = parseFloat(colGapInput.value) || 10;
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

    var order = (arrangeOrderSelect && arrangeOrderSelect.value) || "stacking";
    var revOrder = !!(arrangeReverseOrderCheckbox && arrangeReverseOrderCheckbox.checked);

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`
        arrangeImages(
            ${columns},
            ${rowGap},
            ${colGap},
            ${useUniformWidthCheckbox.checked},
            ${uniformWidthInput.value},
            ${useUniformHeightCheckbox.checked},
            ${uniformHeightInput.value},
            "${order}",
            ${revOrder}
        )
    `, function(result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}

function handleCopySize() {
    console.log("Copy Size button clicked");
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript('copySize()', function (result) {
        if (result && result.indexOf("Error:") === 0) {
            alert(result);
            return;
        }
        if (result && result !== 'EvalScript error.') {
            try {
                var size = eval('(' + result + ')');
                sizeWInput.value = parseFloat(size.width).toFixed(3);
                sizeHInput.value = parseFloat(size.height).toFixed(3);
            } catch (e) {
                alert("Failed to parse size data: " + e.message);
            }
        }
    });
}

function handlePasteSize() {
    console.log("Paste Size button clicked");
    var width = parseFloat(sizeWInput.value);
    var height = parseFloat(sizeHInput.value);
    var useW = useSizeWCheckbox.checked;
    var useH = useSizeHCheckbox.checked;

    if ((useW && isNaN(width)) || (useH && isNaN(height))) {
        alert("Please enter a valid width and height for the selected options.");
        return;
    }
    
    if (!useW && !useH) {
        alert("Please select at least one dimension (Width or Height) to paste.");
        return;
    }

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    var script = `pasteSize(${width || 0}, ${height || 0}, ${useW}, ${useH})`;
    csInterface.evalScript(script, function (result) {
        if (result && result.indexOf("Error:") === 0) {
            alert(result);
        } else if (result === 'EvalScript error.') {
            alert('Error executing the pasteSize script.');
        }
    });
}

function handleAddLabel() {
    var fontFamily = fontFamilyInput.value || "Arial";
    var fontSize = parseFloat(fontSizeInput.value) || 12;
    var labelOffsetX = parseFloat(labelOffsetXInput.value) || -12;
    var labelOffsetY = parseFloat(labelOffsetYInput.value) || -6;
    var labelTemplate = labelTemplateSelect.value || "A";

    var order = (labelsOrderSelect && labelsOrderSelect.value) || "stacking";
    var revOrder = !!(labelsReverseOrderCheckbox && labelsReverseOrderCheckbox.checked);

    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`
        addLabelsToImages(
            "${fontFamily}",
            ${fontSize},
            ${labelOffsetX},
            ${labelOffsetY},
            "${labelTemplate}",
            "${order}",
            ${revOrder}
        )
    `, function (result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}
