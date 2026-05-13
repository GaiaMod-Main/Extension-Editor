let comments;
let blocks;
let publicJS;
let translate;
let dynamicMenus;

const MAX_HISTORY_LENGTH = 120;
let historyStack = [];
let historyIndex = -1;
let isApplyingHistory = false;

const cloneState = (state = null) => JSON.parse(JSON.stringify(state || {
    comments,
    blocks,
    publicJS,
    translate,
    dynamicMenus,
}));

const applyStateSnapshot = (snapshot) => {
    const nextState = cloneState(snapshot);
    comments = nextState.comments;
    blocks = nextState.blocks;
    publicJS = nextState.publicJS;
    translate = nextState.translate;
    dynamicMenus = nextState.dynamicMenus;
};

const emitHistoryChange = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('astra-storage-history-change', {
        detail: getHistoryState()
    }));
};

const pushHistorySnapshot = () => {
    if (isApplyingHistory) return;

    const snapshot = cloneState();
    const currentSnapshot = historyStack[historyIndex];
    if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(snapshot)) {
        emitHistoryChange();
        return;
    }

    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snapshot);

    if (historyStack.length > MAX_HISTORY_LENGTH) {
        historyStack.shift();
    }

    historyIndex = historyStack.length - 1;
    emitHistoryChange();
};

export function init() {
    comments = {
        "name": "A Extension",
        "id": "aExtension",
        "description": "a extension",
        "color": ["#2D2DD2", "#1515B2", "#000087"],
        "author": "a person",
        "license": "MPL-2.0",
        "docsURI": "",
        "menuIconURI": "",
        "blockIconURI": "",
    };
    blocks = {};
    publicJS = "";
    translate = [];
    dynamicMenus = {};
    historyStack = [];
    historyIndex = -1;
    pushHistorySnapshot();
}

export function returnValue(value) {
    switch (value) {
        case "comments":
            return comments;
        case "blocks":
            return blocks;
        case "publicJS":
            return publicJS;
        case "translate":
            return translate;
        case "dynamicMenus":
            return dynamicMenus;
        default:
            throw new Error("Undefined value to return")
    }
}

export function setValueTo(item, value, options = {}) {
    switch (item) {
        case "comments":
            comments = value;
            break
        case "blocks":
            blocks = value;
            break
        case "publicJS":
            publicJS = value;
            break
        case "translate":
            translate = value;
            break
        case "dynamicMenus":
            dynamicMenus = value;
            break
        default:
            throw new Error("Undefined value to set")
    }
    if (options.recordHistory !== false) {
        pushHistorySnapshot();
    } else {
        emitHistoryChange();
    }
}

export function getAllValue() {
    return {
        comments,
        blocks,
        publicJS,
        translate,
        dynamicMenus,
    }
}

export function setAllValue(data, options = {}) {
    if (data.comments) comments = data.comments;
    if (data.blocks) blocks = data.blocks;
    if (data.publicJS) publicJS = data.publicJS;
    if (data.translate) translate = data.translate;
    if (data.dynamicMenus) dynamicMenus = data.dynamicMenus;
    if (options.recordHistory !== false) {
        pushHistorySnapshot();
    } else {
        emitHistoryChange();
    }
}

export function canUndo() {
    return historyIndex > 0;
}

export function canRedo() {
    return historyIndex >= 0 && historyIndex < historyStack.length - 1;
}

export function getHistoryState() {
    return {
        canUndo: canUndo(),
        canRedo: canRedo(),
        historyIndex,
        historyLength: historyStack.length,
    };
}

export function undo() {
    if (!canUndo()) return false;
    isApplyingHistory = true;
    historyIndex -= 1;
    applyStateSnapshot(historyStack[historyIndex]);
    isApplyingHistory = false;
    emitHistoryChange();
    return true;
}

export function redo() {
    if (!canRedo()) return false;
    isApplyingHistory = true;
    historyIndex += 1;
    applyStateSnapshot(historyStack[historyIndex]);
    isApplyingHistory = false;
    emitHistoryChange();
    return true;
}
