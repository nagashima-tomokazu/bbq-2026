/* ========================================
   BBQ 2026 - Google Sheets Integration
   ======================================== */

// ============ CONFIG ============
// Google Spreadsheet ID (URLの /d/ と /edit の間の部分)
const SHEET_ID = 'YOUR_SHEET_ID_HERE';

// シート名（Googleスプレッドシートのタブ名と一致させる）
const SHEETS = {
    members:    { name: '参加者',       tableId: 'members-table',    linkId: 'members-edit-link',    gid: '0' },
    potluck:    { name: '持ち寄り',     tableId: 'potluck-table',    linkId: 'potluck-edit-link',    gid: '1' },
    shopping:   { name: '買い出し',     tableId: 'shopping-table',   linkId: 'shopping-edit-link',   gid: '2' },
    supplies:   { name: '用意するもの', tableId: 'supplies-table',   linkId: 'supplies-edit-link',   gid: '3' },
    accounting: { name: '会計',         tableId: 'accounting-table', linkId: 'accounting-edit-link', gid: '4' },
};
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
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const headerRow = table.querySelector('thead tr');
    const colCount = headerRow ? headerRow.children.length : 3;

    const dataRows = data.slice(1);

    if (dataRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="no-data">まだデータがありません</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    dataRows.forEach(row => {
        const tr = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            const val = row[i] || '';
            td.textContent = val;

            // Status styling
            if (val === '完了' || val === '済') {
                td.classList.add('status-done');
            } else if (val === '未着手' || val === '未') {
                td.classList.add('status-pending');
            } else if (val === '参加' || val === 'OK') {
                td.classList.add('status-ok');
            } else if (val === '不参加' || val === 'NG') {
                td.classList.add('status-ng');
            }

            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });

    return dataRows;
}

/**
 * 会計の合計を計算して表示する
 */
function renderAccountingTotal(data) {
    const dataRows = data.slice(1);
    let total = 0;

    dataRows.forEach(row => {
        const amount = parseInt((row[1] || '0').replace(/[^0-9]/g, ''), 10);
        if (!isNaN(amount)) total += amount;
    });

    const totalBox = document.getElementById('accounting-total');
    const totalAmount = document.getElementById('total-amount');
    if (totalBox && totalAmount && total > 0) {
        totalAmount.textContent = total.toLocaleString();
        totalBox.style.display = 'block';
    }
}

/**
 * スプレッドシート編集リンクを設定する
 */
function setupEditLinks() {
    const editBaseUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

    Object.values(SHEETS).forEach(sheet => {
        const link = document.getElementById(sheet.linkId);
        if (link) {
            link.href = `${editBaseUrl}#gid=${sheet.gid}`;
        }
    });
}

/**
 * エラーメッセージをテーブルに表示
 */
function showError(tableId, message) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const headerRow = table.querySelector('thead tr');
    const colCount = headerRow ? headerRow.children.length : 3;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="no-data">${message}</td></tr>`;
}

/**
 * Smooth scroll for nav links
 */
function setupNav() {
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Highlight active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 80;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * 初期化
 */
async function init() {
    setupEditLinks();
    setupNav();

    if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        Object.values(SHEETS).forEach(sheet => {
            showError(sheet.tableId, 'スプレッドシートが未設定です');
        });
        return;
    }

    // 全シートを並行で読み込み
    const loadSheet = async (key) => {
        const sheet = SHEETS[key];
        try {
            const data = await fetchSheetData(sheet.name);
            renderTable(sheet.tableId, data);
            if (key === 'accounting') {
                renderAccountingTotal(data);
            }
        } catch (e) {
            console.error(`${key} fetch error:`, e);
            showError(sheet.tableId, 'データの読み込みに失敗しました');
        }
    };

    await Promise.all(Object.keys(SHEETS).map(loadSheet));
}

document.addEventListener('DOMContentLoaded', init);
