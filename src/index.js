import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Main from './components/main/main';
import reportWebVitals from './reportWebVitals';
import {
    init,
    returnValue,
    getAllValue,
    setValueTo,
    setAllValue
} from './extension/storage'
import { initTheme } from './lib/theme.js';


// Configure the Monaco Editor loader (using local static assets to prevent loading failures caused by CDNs).
import { loader } from '@monaco-editor/react';


// Initialize storage
init();
initTheme();

//Use PUBLIC_URL to ensure that paths are correct in both development and production environments.
const publicUrl = process.env.PUBLIC_URL || '';
const monacoBasePath = `${publicUrl}/vs`;

// Check if the loader exists.
if (loader && typeof loader.config === 'function') {
    loader.config({
        paths: {
            vs: monacoBasePath
        },
        'vs/nls': {
            availableLanguages: {
                '*': 'zh-cn'
            }
        }
    });
}

// Ignore ResizeObserver Loop Warnings (The World's Dumbest Warning)
const debounce = (fn, delay) => {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
};

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback) {
        callback = debounce(callback, 16);
        super(callback);
    }
};

if (process.env.NODE_ENV === 'development') {
    window.storage = {
        get: returnValue,
        getAll: getAllValue,
        set: setValueTo,
        setAll: setAllValue
    };
}
  

import ToastContainer from './components/toast/toast.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Main />
    <ToastContainer />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
