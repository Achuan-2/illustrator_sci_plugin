// Illustrator ExtendScript Functions
// Helper function to convert mm to points
function mmToPoints(mm) {
    return mm * 2.83464567;
}
function pointsToMm(points) {
    return points / 2.83464567;
}

// Simple stringifier to avoid ExtendScript's lack of native JSON support
function simpleJsonStringify(arr) {
    var parts = [];
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        parts.push('{"deltaX":' + item.deltaX + ',"deltaY":' + item.deltaY + '}');
    }
    return '[' + parts.join(',') + ']';
}

// 更稳健的获取“可视区域”边界，参考用户提供逻辑，优先基于剪切路径/复合路径计算
// 返回 [left, top, right, bottom]，未能获取时返回 undefined
function getVisibleBounds(o) {
    var bounds, clippedItem, sandboxItem, sandboxLayer;
    var curItem;

    // 跳过参考线
    if (o.guides) {
        return undefined;
    }

    if (o.typename == "GroupItem") {
        // 空组直接跳过
        if (!o.pageItems || o.pageItems.length == 0) {
            return undefined;
        }
        // 组被剪切
        if (o.clipped) {
            // 在子项中寻找 clipping path
            for (var i = 0; i < o.pageItems.length; i++) {
                curItem = o.pageItems[i];
                if (curItem.clipping) {
                    clippedItem = curItem;
                    break;
                } else if (curItem.typename == "CompoundPathItem") {
                    if (!curItem.pathItems.length) {
                        // 处理没有 pathItems 的复合路径（沙盒层拆复合）
                        sandboxLayer = app.activeDocument.layers.add();
                        sandboxItem = curItem.duplicate(sandboxLayer);
                        app.activeDocument.selection = null;
                        sandboxItem.selected = true;
                        app.executeMenuCommand("noCompoundPath");
                        sandboxLayer.hasSelectedArtwork = true;
                        app.executeMenuCommand("group");
                        clippedItem = app.activeDocument.selection[0];
                        break;
                    } else if (curItem.pathItems[0].clipping) {
                        clippedItem = curItem;
                        break;
                    }
                }
            }
            if (!clippedItem) {
                clippedItem = o.pageItems[0];
            }
            bounds = clippedItem.geometricBounds;
            if (sandboxLayer) {
                // 清理沙盒
                sandboxLayer.remove();
                sandboxLayer = undefined;
            }
        } else {
            // 非剪切组：聚合所有子项的可视边界
            var subObjectBounds;
            var allBoundPoints = [[], [], [], []];
            for (var j = 0; j < o.pageItems.length; j++) {
                curItem = o.pageItems[j];
                subObjectBounds = getVisibleBounds(curItem);
                if (!subObjectBounds) continue;
                for (var k = 0; k < subObjectBounds.length; k++) {
                    allBoundPoints[k].push(subObjectBounds[k]);
                }
            }
            if (allBoundPoints[0].length) {
                bounds = [
                    Math.min.apply(Math, allBoundPoints[0]),
                    Math.max.apply(Math, allBoundPoints[1]),
                    Math.max.apply(Math, allBoundPoints[2]),
                    Math.min.apply(Math, allBoundPoints[3])
                ];
            } else {
                // 回退
                bounds = o.geometricBounds;
            }
        }
    } else {
        // 基础对象：直接用几何边界
        bounds = o.geometricBounds;
    }
    return bounds;
}

// 统一封装：返回对象的可视信息
function getVisibleInfo(item) {
    var vb = getVisibleBounds(item) || item.visibleBounds;
    var left = vb[0];
    var top = vb[1];
    var right = vb[2];
    var bottom = vb[3];
    var width = right - left;
    var height = top - bottom;
    return {
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        width: width,
        height: height,
        bounds: vb
    };
}

// 按目标“可视宽度”进行等比缩放（基于 getVisibleBounds 计算比例）
function scaleItemToVisibleWidth(item, targetW) {
    if (!targetW || targetW <= 0) return;
    var info = getVisibleInfo(item);
    if (info.width <= 0) return;
    var scale = (targetW / info.width) * 100; // 百分比
    item.resize(scale, scale, true, true, true, true, scale, Transformation.CENTER);
}

// 按目标“可视高度”进行等比缩放（基于 getVisibleBounds 计算比例）
function scaleItemToVisibleHeight(item, targetH) {
    if (!targetH || targetH <= 0) return;
    var info = getVisibleInfo(item);
    if (info.height <= 0) return;
    var scale = (targetH / info.height) * 100;
    item.resize(scale, scale, true, true, true, true, scale, Transformation.CENTER);
}

// 将对象的可视左上角移动到指定 (xLeft, yTop)
function moveItemTopLeftTo(item, xLeft, yTop) {
    var info = getVisibleInfo(item);
    var dx = xLeft - info.left;
    var dy = yTop - info.top;
    item.translate(dx, dy);
}

/**
 * 根据 order 与 reverse 对 selection 进行排序
 * order: "stacking" | "horizontal" | "vertical"
 * reverse: boolean
 */
function getOrderedSelection(selection, order, reverse) {
    var arr = [];
    for (var i = 0; i < selection.length; i++) arr.push(selection[i]);

    var ord = order || "stacking";
    if (ord === "horizontal" || ord === "vertical") {
        arr.sort(function (a, b) {
            var ia = getVisibleInfo(a);
            var ib = getVisibleInfo(b);
            var cxA = ia.left;
            var cyA = ia.top;
            var cxB = ib.left;
            var cyB = ib.top;

            if (ord === "horizontal") {
                // 从左到右
                if (cxA < cxB) return -1;
                if (cxA > cxB) return 1;
                // 次级按 Y 从上到下（top 值大在前）
                if (cyA > cyB) return -1;
                if (cyA < cyB) return 1;
                return 0;
            } else {
                // vertical: 从上到下（top 值大在前）
                if (cyA > cyB) return -1;
                if (cyA < cyB) return 1;
                // 次级按 X 从左到右
                if (cxA < cxB) return -1;
                if (cxA > cxB) return 1;
                return 0;
            }
        });
    } // stacking: 保持原顺序

    if (reverse) {
        var i = 0, j = arr.length - 1, tmp;
        while (i < j) {
            tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            i++; j--;
        }
    }
    return arr;
}

function arrangeImages(columns, rowGap, colGap, useWidth, wVal, useHeight, hVal, order, reverseOrder) {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        alert("Please select items to arrange");
        return;
    }

    // Convert mm values to points
    var rowGapPt = mmToPoints(rowGap);
    var colGapPt = mmToPoints(colGap);
    var wValPt = useWidth ? mmToPoints(wVal) : 0;
    var hValPt = useHeight ? mmToPoints(hVal) : 0;

    // 使用排序后的序列进行排列
    var ordered = getOrderedSelection(selection, order || "stacking", !!reverseOrder);

    // 起点：排序后第一个对象的可视左上
    var firstInfo = getVisibleInfo(ordered[0]);
    var startX = firstInfo.left;
    var startY = firstInfo.top;

    // 先按需要统一缩放（基于可视宽/高）
    for (var i = 0; i < ordered.length; i++) {
        var it = ordered[i];
        if (useHeight && hVal > 0) {
            scaleItemToVisibleHeight(it, hValPt);
        }
        if (useWidth && wVal > 0) {
            scaleItemToVisibleWidth(it, wValPt);
        }
    }

    // Arrange items using current position tracking (基于可视尺寸与位置)
    var currentX = startX;
    var currentY = startY;
    var maxRowHeight = 0;
    var count = 0;

    for (var j = 0; j < ordered.length; j++) {
        var item = ordered[j];
        // 将当前 item 的可视左上角对齐到 currentX/currentY
        moveItemTopLeftTo(item, currentX, currentY);

        // 获取对齐后的最新可视信息
        var infoAfter = getVisibleInfo(item);

        // 更新本行最大“可视高度”
        if (infoAfter.height > maxRowHeight) {
            maxRowHeight = infoAfter.height;
        }

        count++;
        if (count < columns) {
            // 横向推进：可视宽度 + 列间距
            currentX += infoAfter.width + colGapPt;
        } else {
            // 换行
            count = 0;
            currentX = startX;
            currentY -= maxRowHeight + rowGapPt;
            maxRowHeight = 0;
        }
    }
}

function addLabelsToImages(fontFamily, fontSize, labelOffsetX, labelOffsetY, labelTemplate, order, reverseOrder) {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        alert("Please select items to label");
        return;
    }

    var templates = {
        "A": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a": "abcdefghijklmnopqrstuvwxyz",
        "A)": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a)": "abcdefghijklmnopqrstuvwxyz"
    };

    var labels = templates[labelTemplate] || templates["A"];
    var ordered = getOrderedSelection(selection, order || "stacking", !!reverseOrder);

    for (var i = 0; i < ordered.length; i++) {
        try {
            var item = ordered[i];
            var label = labels[i % labels.length];
            if (labelTemplate === "A)" || labelTemplate === "a)") {
                label += ")";
            }
            // 基于可视区域定位标签
            var v = getVisibleInfo(item);
            var textFrame = doc.textFrames.add();
            textFrame.contents = label;
            // 将标签放在可视左上位置并加偏移
            textFrame.top = v.top - labelOffsetY;
            textFrame.left = v.left + labelOffsetX;

            // Style the text
            textFrame.textRange.characterAttributes.size = fontSize;
            try {
                textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontFamily === "Arial" ? "ArialMT" : fontFamily);
            } catch (e) {
                alert("Font not found: " + fontFamily);
            }
        } catch (e) {
            // Handle errors without stopping the loop
            alert("Error adding label to item " + (i + 1) + ": " + e.message);
        }
    }
}


function copyRelativePosition(corner, order, reverseOrder) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length < 2) {
        return "Error: Please select at least two items.";
    }

    var ord = order || "stacking";
    var revOrd = !!reverseOrder;
    var ordered = getOrderedSelection(selection, ord, revOrd);

    // 确定参考对象 (refItem)
    // 对于堆叠顺序 (stacking)，参考对象默认为最后一个，否则为第一个
    var refItem = (ord === "stacking") ? ordered[ordered.length - 1] : ordered[0];

    // 其他所有对象为目标对象 (objItems)
    var objItems = [];
    for (var i = 0; i < ordered.length; i++) {
        if (ordered[i] !== refItem) {
            objItems.push(ordered[i]);
        }
    }
    
    // 使用可视边界，适配剪切蒙版/复合路径
    var refB = getVisibleBounds(refItem) || refItem.visibleBounds;
    var deltas = [];

    // 遍历所有目标对象，计算相对位置
    for (var j = 0; j < objItems.length; j++) {
        var objItem = objItems[j];
        var objB = getVisibleBounds(objItem) || objItem.visibleBounds;

        var x1, y1, x2, y2;
        // 基于角点取坐标
        switch (corner) {
            case "TR": x1 = refB[2]; y1 = refB[1]; x2 = objB[2]; y2 = objB[1]; break;
            case "BL": x1 = refB[0]; y1 = refB[3]; x2 = objB[0]; y2 = objB[3]; break;
            case "BR": x1 = refB[2]; y1 = refB[3]; x2 = objB[2]; y2 = objB[3]; break;
            default:   x1 = refB[0]; y1 = refB[1]; x2 = objB[0]; y2 = objB[1]; break; // TL
        }

        var deltaX = x2 - x1;
        var deltaY = y2 - y1;
        
        deltas.push({
            deltaX: pointsToMm(deltaX),
            deltaY: pointsToMm(deltaY)
        });
    }

    // 返回包含所有相对位置信息的 JSON 字符串
    return simpleJsonStringify(deltas);
}

function pasteRelativePosition(deltasJSON, reverse, corner, order, reverseOrder, overrideDeltaX, overrideDeltaY, allowMismatch) {
    if (app.documents.length === 0) return "Error: No document open.";
    // 都不为null或都不为0
    var useOverride = (overrideDeltaX !== null && overrideDeltaX !== 0) && (overrideDeltaY !== null && overrideDeltaY !== 0);

    if (!useOverride && !deltasJSON) return "Error: No relative position data provided.";

    var doc = app.activeDocument;
    var selection = doc.selection;
    var deltas;

    if (!useOverride) {
        try {
            deltas = eval('(' + deltasJSON + ')');
            if (!deltas || typeof deltas.length === "undefined") throw new Error("Invalid data format.");
        } catch(e) {
            return "Error: Invalid relative position data. " + e.message;
        }
        if (deltas.length === 0) {
            return "Error: No relative position data provided.";
        }
    }

    if (selection.length < 2) {
        return "Error: Please select at least two items.";
    }

    if (!useOverride && (selection.length - 1 !== deltas.length)) {
        if (!allowMismatch) {
            return "Error: The number of items to move (" + (selection.length - 1) + ") does not match the saved data count (" + deltas.length + ").";
        }
    }

    var ord = order || "stacking";
    var revOrd = !!reverseOrder;

    var ordered = getOrderedSelection(selection, ord, revOrd);

    var newReference = (ord === "stacking") ? ordered[ordered.length - 1] : ordered[0];
    
    var objectsToMove = [];
    for (var i = 0; i < ordered.length; i++) {
        if (ordered[i] !== newReference) {
            objectsToMove.push(ordered[i]);
        }
    }
    
    var refBounds = getVisibleBounds(newReference) || newReference.visibleBounds;

    for (var k = 0; k < objectsToMove.length; k++) {
        var objectToMove = objectsToMove[k];
        var objBounds = getVisibleBounds(objectToMove) || objectToMove.visibleBounds;
        
        var deltaXPt, deltaYPt;
        if (useOverride) {
            deltaXPt = mmToPoints(overrideDeltaX);
            deltaYPt = mmToPoints(overrideDeltaY);
        } else {
            var idx = k % deltas.length;
            var delta = deltas[idx];
            deltaXPt = mmToPoints(delta.deltaX);
            deltaYPt = mmToPoints(delta.deltaY);
        }
        
        var newX, newY;

        switch (corner) {
            case "TR":
                newX = refBounds[2] + deltaXPt; newY = refBounds[1] + deltaYPt;
                objectToMove.translate(newX - objBounds[2], newY - objBounds[1]);
                break;
            case "BL":
                newX = refBounds[0] + deltaXPt; newY = refBounds[3] + deltaYPt;
                objectToMove.translate(newX - objBounds[0], newY - objBounds[3]);
                break;
            case "BR":
                newX = refBounds[2] + deltaXPt; newY = refBounds[3] + deltaYPt;
                objectToMove.translate(newX - objBounds[2], newY - objBounds[3]);
                break;
            default: // TL
                newX = refBounds[0] + deltaXPt; newY = refBounds[1] + deltaYPt;
                objectToMove.translate(newX - objBounds[0], newY - objBounds[1]);
                break;
        }
    }

    return "Success";
}

function copySize() {
    if (app.documents.length === 0) return "Error: No document open.";
    var selection = app.activeDocument.selection;
    if (selection.length === 0) return "Error: Please select an item.";

    var item = selection[0];
    var info = getVisibleInfo(item);

    var size = {
        width: pointsToMm(info.width),
        height: pointsToMm(info.height)
    };
    return '{"width":' + size.width + ',"height":' + size.height + '}';
}

function pasteSize(width, height, useW, useH) {
    if (app.documents.length === 0) return "Error: No document open.";
    
    var selection = app.activeDocument.selection;
    if (selection.length === 0) return "Error: Please select items to resize.";

    if (!useW && !useH) return "Success: No action taken.";
    
    var targetWidthPt = useW ? mmToPoints(width) : 0;
    var targetHeightPt = useH ? mmToPoints(height) : 0;

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        var info = getVisibleInfo(item);
        
        if (info.width <= 0 || info.height <= 0) continue;

        var scaleX = 100, scaleY = 100;

        if (useW && useH) {
            // Both are checked, non-uniform scale
            scaleX = (targetWidthPt / info.width) * 100;
            scaleY = (targetHeightPt / info.height) * 100;
        } else if (useW) {
            // Only width is checked, uniform scale
            scaleX = scaleY = (targetWidthPt / info.width) * 100;
        } else if (useH) {
            // Only height is checked, uniform scale
            scaleX = scaleY = (targetHeightPt / info.height) * 100;
        }

        item.resize(scaleX, scaleY, true, true, true, true, 100, Transformation.CENTER);
    }
    return "Success";
}

/**
 * Swap positions of exactly two selected items based on their visible top-left corners.
 * Returns "Success" or "Error: ..." string for host to handle.
 */
function swapSelectedPositions() {
    if (app.documents.length === 0) return "Error: No document open.";
    var selection = app.activeDocument.selection;
    if (!selection || selection.length !== 2) {
        return "Error: Please select exactly two items.";
    }

    var a = selection[0];
    var b = selection[1];

    // Record original visible top-lefts before any movement
    var infoA = getVisibleInfo(a);
    var infoB = getVisibleInfo(b);

    // Move each to the other's original position
    moveItemTopLeftTo(a, infoB.left, infoB.top);
    moveItemTopLeftTo(b, infoA.left, infoA.top);

    return "Success";
}
