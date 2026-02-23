/* ========================================
   BBQ 2026 - Google Sheets Integration
   ======================================== */

// ============ CONFIG ============
// Google Spreadsheet ID (URLの /d/ と /edit の間の部分)
const SHEET_ID = 'YOUR_SHEET_ID_HERE';

// シート名
const POTLUCK_SHEET = '持ち寄りリスト';
const SHOPPING_SHEET = '買い物リスト';
// ================================

/**
 * Google SheetsからCSVデータを取得する
 */
async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }

    const csv = await response.text();
    return parseCSV(csv);
}

/**
 * CSVをパースして配列の配列にする
 */
function parseCSV(csv) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    let row = [];

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];

        if (inQuotes) {
            if (char === '"' && csv[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(current.trim());
                current = '';
            } else if (char === '\n' || (char === '\r' && csv[i + 1] === '\n')) {
                row.push(current.trim());
                current = '';
                if (row.some(cell => cell !== '')) {
                    rows.push(row);
                }
                row = [];
                if (char === '\r') i++;
            } else {
                current += char;
            }
        }
    }

    // Last row
    if (current !== '' || row.length > 0) {
        row.push(current.trim());
        if (row.some(cell => cell !== '')) {
            rows.push(row);
        }
    }

    return rows;
}

/**
 * テーブルにデータを描画する
 */
function renderTable(tableId, data) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');

    // ヘッダー行をスキップ（1行目はカラム名）
    const dataRows = data.slice(1);

    if (dataRows.length === 0) {
        const colCount = table.querySelector('thead tr').children.length;
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="no-data">まだデータがありません</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    dataRows.forEach(row => {
        const tr = document.createElement('tr');
        const headerCols = table.querySelector('thead tr').children.length;

        for (let i = 0; i < headerCols; i++) {
            const td = document.createElement('td');
            td.textContent = row[i] || '';
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

/**
 * スプレッドシート編集リンクを設定する
 */
function setupEditLinks() {
    const editUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

    const potluckLink = document.getElementById('potluck-edit-link');
    const shoppingLink = document.getElementById('shopping-edit-link');

    if (potluckLink) potluckLink.href = editUrl + '#gid=0';
    if (shoppingLink) shoppingLink.href = editUrl + '#gid=1';
}

/**
 * エラーメッセージをテーブルに表示
 */
function showError(tableId, message) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const colCount = table.querySelector('thead tr').children.length;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="no-data">${message}</td></tr>`;
}

/**
 * 初期化
 */
async function init() {
    setupEditLinks();

    if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        showError('potluck-table', 'スプレッドシートが未設定です');
        showError('shopping-table', 'スプレッドシートが未設定です');
        return;
    }

    // 持ち寄りリスト読み込み
    try {
        const potluckData = await fetchSheetData(POTLUCK_SHEET);
        renderTable('potluck-table', potluckData);
    } catch (e) {
        console.error('Potluck fetch error:', e);
        showError('potluck-table', 'データの読み込みに失敗しました');
    }

    // 買い物リスト読み込み
    try {
        const shoppingData = await fetchSheetData(SHOPPING_SHEET);
        renderTable('shopping-table', shoppingData);
    } catch (e) {
        console.error('Shopping fetch error:', e);
        showError('shopping-table', 'データの読み込みに失敗しました');
    }
}

document.addEventListener('DOMContentLoaded', init);
