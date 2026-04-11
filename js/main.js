import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { firebaseConfig, i18n, cardEffects } from "./config.js";
import { getRarityStyle, getRarityName, calculateValue } from "./utils.js";

// 應用程式狀態管理
let state = {
    lang: 'zh',
    database: [],
    filtered: [],
    currentPage: 1,
    isLoaded: false
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/** 更新連線狀態標籤 */
function setStatus(type) {
    const tag = document.getElementById('status-tag');
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');

    if (type === 'connected') {
        tag.className = "status-badge-connected";
        dot.className = "status-dot bg-emerald-600";
        txt.innerText = "CONNECTED";
    } else if (type === 'error') {
        tag.className = "status-badge-error";
        dot.className = "status-dot bg-red-600";
        txt.innerText = "OFFLINE";
    }
}

/** 執行搜尋與過濾 */
function performSearch(resetPage = true) {
    if (!state.isLoaded) return;
    if (resetPage) state.currentPage = 1;

    const query = document.getElementById('query-input').value.toLowerCase();
    const rarity = document.getElementById('rarity-select').value;
    const effect = document.getElementById('effect-select').value;

    state.filtered = state.database.filter(item => {
        const nameZh = item.name?.zh || "";
        const nameJa = item.name?.ja || "";
        const nameMatch = nameZh.toLowerCase().includes(query) || nameJa.toLowerCase().includes(query);
        const rarityMatch = rarity === 'ALL' || item.rarity === rarity;
        const effectMatch = effect === 'ALL' || item.effectTag === effect;
        return nameMatch && rarityMatch && effectMatch;
    });

    render();
}

/** 渲染頁面 UI */
function render() {
    const level = parseInt(document.getElementById('level-select').value);
    const limit = parseInt(document.getElementById('limit-select').value);
    const totalFound = state.filtered.length;
    const totalPages = Math.ceil(totalFound / limit);

    // 更新計數器
    document.getElementById('result-count').innerText = i18n[state.lang].result
        .replace('{n}', totalFound)
        .replace('{p}', state.currentPage);

    // 切片當前頁面資料
    const startIndex = (state.currentPage - 1) * limit;
    const items = state.filtered.slice(startIndex, startIndex + limit);

    // 渲染網格
    const grid = document.getElementById('card-grid');
    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-slate-400 font-medium">${i18n[state.lang].noData}</div>`;
    } else {
        grid.innerHTML = items.map(item => {
            const name = item.name?.[state.lang] || item.name?.zh || "Unknown";
            const descTpl = item.desc?.[state.lang] || item.desc?.zh || "";
            const val = calculateValue(item, level);
            const desc = descTpl.replace('{v}', val.toFixed(2));
            const imgHtml = item.img && (item.img.startsWith('http') || item.img.startsWith('data:image'))
                ? `<img src="${item.img}" class="h-28 w-28 object-contain">`
                : `<span class="text-5xl">${item.img || '❌'}</span>`;

            return `
            <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-blue-300 transition-all flex flex-col h-full card-shadow">
                <div class="h-40 bg-slate-50 flex items-center justify-center relative shrink-0">
                    ${imgHtml}
                    <span class="absolute top-3 right-3 text-base font-bold px-3 py-1 rounded-xl border ${getRarityStyle(item.rarity)}">${getRarityName(item.rarity, state.lang)}</span>
                    <span class="absolute bottom-3 left-3 bg-white/90 border border-slate-100 text-blue-600 px-3 py-1 rounded-lg text-base font-black shadow-sm">${i18n[state.lang].lvLabel} ${level}</span>
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="mb-4 min-h-[3rem]"><h3 class="font-bold text-slate-800 text-base line-clamp-2">${name}</h3></div>
                    <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1 flex items-center">
                        <p class="text-xs text-slate-500 font-medium leading-relaxed">${desc}</p>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    renderPagination(totalPages);
}

/** 渲染分頁按鈕 */
function renderPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    if (totalPages <= 1) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');

    let html = `<button id="prev-page" class="pagination-btn inactive ${state.currentPage === 1 ? 'disabled' : ''}">Prev</button>`;
    
    let start = Math.max(1, state.currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        html += `<button class="pagination-btn page-num ${i === state.currentPage ? 'active' : 'inactive'}" data-page="${i}">${i}</button>`;
    }

    html += `<button id="next-page" class="pagination-btn inactive ${state.currentPage === totalPages ? 'disabled' : ''}">Next</button>`;
    container.innerHTML = html;

    // 綁定點擊事件
    container.querySelectorAll('.page-num').forEach(btn => {
        btn.onclick = () => { state.currentPage = parseInt(btn.dataset.page); render(); window.scrollTo({top:0, behavior:'smooth'}); };
    });
    document.getElementById('prev-page').onclick = () => { if(state.currentPage > 1) { state.currentPage--; render(); }};
    document.getElementById('next-page').onclick = () => { if(state.currentPage < totalPages) { state.currentPage++; render(); }};
}

/** 更新靜態文字 */
function updateLanguageUI() {
    const t = i18n[state.lang];
    document.getElementById('nav-cards-label').innerText = t.navCards;
    document.getElementById('header-title').innerText = t.header;
    document.getElementById('label-search').innerText = t.search;
    document.getElementById('label-rarity').innerText = t.rarity;
    document.getElementById('label-effect').innerText = t.effect;
    document.getElementById('label-level').innerText = t.level;
    document.getElementById('label-limit').innerText = t.limit;
    document.getElementById('btn-search-text').innerText = t.btnSearch;
    document.getElementById('reset-btn').innerText = t.btnReset;
    document.getElementById('query-input').placeholder = t.placeholder;

    // 更新選單選項
    const curRarity = document.getElementById('rarity-select').value;
    const curEffect = document.getElementById('effect-select').value;
    
    document.getElementById('rarity-select').innerHTML = t.rarityOptions.map(o => `<option value="${o.val}">${o.lab}</option>`).join('');
    document.getElementById('effect-select').innerHTML = cardEffects[state.lang].map(o => `<option value="${o.val}">${o.lab}</option>`).join('');
    
    document.getElementById('rarity-select').value = curRarity || 'ALL';
    document.getElementById('effect-select').value = curEffect || 'ALL';

    // 語言切換按鈕狀態
    document.getElementById('lang-zh').className = `flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${state.lang==='zh' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;
    document.getElementById('lang-ja').className = `flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${state.lang==='ja' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;
}

// 初始化
window.onload = () => {
    // 等級下拉選單
    document.getElementById('level-select').innerHTML = Array.from({length: 20}, (_, i) => `<option value="${i+1}" ${i+1===10 ? 'selected' : ''}>Lv. ${i+1}</option>`).join('');

    // 自動偵測語系
    if (navigator.language.startsWith('ja')) state.lang = 'ja';
    updateLanguageUI();

    // 監聽 Firebase
    onValue(ref(db, 'tosm/data/card'), (snap) => {
        const data = snap.val();
        if (data) {
            state.database = Array.isArray(data) ? data : Object.values(data);
            state.isLoaded = true;
            setStatus('connected');
            document.getElementById('db-loader').classList.add('hidden');
            document.getElementById('card-grid').classList.remove('hidden');
            performSearch();
        }
    }, () => setStatus('error'));

    // 事件處理
    document.getElementById('lang-zh').onclick = () => { state.lang = 'zh'; updateLanguageUI(); performSearch(); };
    document.getElementById('lang-ja').onclick = () => { state.lang = 'ja'; updateLanguageUI(); performSearch(); };
    document.getElementById('search-btn').onclick = () => performSearch(true);
    document.getElementById('level-select').onchange = () => render();
    document.getElementById('rarity-select').onchange = () => performSearch(true);
    document.getElementById('effect-select').onchange = () => performSearch(true);
    document.getElementById('limit-select').onchange = () => performSearch(true);
    document.getElementById('query-input').onkeypress = (e) => { if(e.key === 'Enter') performSearch(true); };
    document.getElementById('reset-btn').onclick = () => {
        document.getElementById('query-input').value = '';
        document.getElementById('rarity-select').value = 'ALL';
        document.getElementById('effect-select').value = 'ALL';
        document.getElementById('level-select').value = '10';
        performSearch(true);
    };
};