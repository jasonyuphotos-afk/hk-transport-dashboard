// ================= 顯示與主題控制 =================
function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeIcon();
}

window.addEventListener('DOMContentLoaded', updateThemeIcon);

// ================= 收合控制 (Accordion) =================
let lrtExpanded = true;
let kmbExpanded = false;
let mtrExpanded = false;

function updateAccordionUI() {
    const lrtContent = document.getElementById('lrt-content');
    const lrtIcon = document.getElementById('lrt-toggle-icon');
    if (lrtExpanded) {
        lrtContent.classList.remove('collapsed');
        lrtIcon.style.transform = "rotate(0deg)";
    } else {
        lrtContent.classList.add('collapsed');
        lrtIcon.style.transform = "rotate(-90deg)";
    }

    const kmbContent = document.getElementById('kmb-content');
    const kmbIcon = document.getElementById('kmb-toggle-icon');
    if (kmbExpanded) {
        kmbContent.classList.remove('collapsed');
        kmbIcon.style.transform = "rotate(0deg)";
    } else {
        kmbContent.classList.add('collapsed');
        kmbIcon.style.transform = "rotate(-90deg)";
    }

    const mtrContent = document.getElementById('mtr-content');
    const mtrIcon = document.getElementById('mtr-toggle-icon');
    if (mtrContent) {
        if (mtrExpanded) {
            mtrContent.classList.remove('collapsed');
            mtrIcon.style.transform = "rotate(0deg)";
        } else {
            mtrContent.classList.add('collapsed');
            mtrIcon.style.transform = "rotate(-90deg)";
        }
    }
}

function toggleLRT() {
    lrtExpanded = !lrtExpanded;
    if (lrtExpanded) { kmbExpanded = false; mtrExpanded = false; } 
    updateAccordionUI();
}

function toggleKMB() {
    kmbExpanded = !kmbExpanded;
    if (kmbExpanded) { lrtExpanded = false; mtrExpanded = false; } 
    updateAccordionUI();
}

function toggleMTR() {
    mtrExpanded = !mtrExpanded;
    if (mtrExpanded) { lrtExpanded = false; kmbExpanded = false; } 
    updateAccordionUI();
}

// ================= 通用時間控制 =================
function updateClock() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    document.getElementById('current-time').textContent = 
        `${now.getMonth()+1}月${now.getDate()}日 (${days[now.getDay()]}) ` + 
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}
setInterval(updateClock, 1000);
updateClock();

// ================= 彈出視窗控制 (Modals) =================
function openWarningModal() { document.getElementById('warning-modal').classList.remove('hidden'); setTimeout(() => { document.getElementById('warning-modal').classList.remove('opacity-0'); }, 10); }
function closeWarningModal() { document.getElementById('warning-modal').classList.add('opacity-0'); setTimeout(() => { document.getElementById('warning-modal').classList.add('hidden'); }, 300); }
function openTrafficModal() { if(fullTrafficText) { document.getElementById('traffic-modal').classList.remove('hidden'); setTimeout(() => { document.getElementById('traffic-modal').classList.remove('opacity-0'); }, 10); } }
function closeTrafficModal() { document.getElementById('traffic-modal').classList.add('opacity-0'); setTimeout(() => { document.getElementById('traffic-modal').classList.add('hidden'); }, 300); }

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const listContainer = document.getElementById('station-list-settings');
    listContainer.innerHTML = '';
    document.getElementById('station-search').value = '';
    
    for (const [groupName, stations] of Object.entries(STATION_GROUPS)) {
        let html = `<div class="group-container"><h4 class="text-blue-600 dark:text-[#64d2ff] font-bold text-sm mb-2 pb-1 border-b border-gray-200 dark:border-gray-700/60">${groupName}</h4><div class="grid grid-cols-2 gap-2">`;
        for (const [id, name] of Object.entries(stations)) {
            const isChecked = selectedStations.includes(id) ? 'checked' : '';
            html += `
                <label class="station-item flex items-center justify-between p-2.5 bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-[#3a3a3c] transition-colors cursor-pointer shadow-sm" data-name="${name}" data-id="${id}">
                    <span class="text-sm font-bold text-gray-800 dark:text-white truncate pr-1">${name} <span class="text-gray-500 text-[10px] ml-0.5">(${id})</span></span>
                    <input type="checkbox" value="${id}" class="w-4 h-4 accent-blue-600 rounded flex-shrink-0" onchange="toggleStationSelection('${id}', this.checked)" ${isChecked}>
                </label>`;
        }
        html += `</div></div>`;
        listContainer.innerHTML += html;
    }
    renderSortList();
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeSettings() {
    if (selectedStations.length === 0) { alert("請至少選擇一個車站！"); return; }
    
    if (document.getElementById('lrt-sort-section').classList.contains('absolute')) { toggleExpandSort('lrt'); }
    
    localStorage.setItem('lrtStations', JSON.stringify(selectedStations)); 
    if (!selectedStations.includes(currentStationId)) currentStationId = selectedStations[0];
    document.getElementById('settings-modal').classList.add('hidden'); document.getElementById('settings-modal').classList.remove('flex');
    renderLrtTags(); fetchLRTData();
}

// ================= 巴士設定視窗（包含四種分頁）================
function switchBusTab(type) {
    const tabs = ['kmb', 'ctb', 'mtrbus', 'gmb'];
    const tabIds = ['tab-kmb', 'tab-ctb', 'tab-mtrbus', 'tab-gmb'];
    const panelIds = ['search-panel-kmb', 'search-panel-ctb', 'search-panel-mtrbus', 'search-panel-gmb'];
    const colors = {
        kmb: { active: '#ff453a', inactive: 'gray-500' },
        ctb: { active: '#0033a0', inactive: 'gray-500' },
        mtrbus: { active: '#007078', inactive: 'gray-500' },
        gmb: { active: '#34c759', inactive: 'gray-500' }
    };
    const statusEl = document.getElementById('kmb-search-status');
    const container = document.getElementById('kmb-route-results');
    statusEl.innerText = '';
    container.innerHTML = '';

    tabs.forEach((t, idx) => {
        const tabBtn = document.getElementById(tabIds[idx]);
        const panel = document.getElementById(panelIds[idx]);
        if (t === type) {
            tabBtn.className = `flex-1 py-2 text-sm font-bold text-[${colors[t].active}] border-b-2 border-[${colors[t].active}] transition-colors`;
            panel.classList.remove('hidden');
        } else {
            tabBtn.className = `flex-1 py-2 text-sm font-bold text-gray-500 dark:text-gray-500 border-b-2 border-transparent transition-colors`;
            panel.classList.add('hidden');
        }
    });
}

function openKmbSettings() {
    renderKmbSortList();
    document.getElementById('kmb-route-input').value = '';
    document.getElementById('ctb-route-input').value = '';
    document.getElementById('mtrbus-route-input').value = '';
    document.getElementById('gmb-route-input').value = '';
    document.getElementById('kmb-route-results').innerHTML = '';
    document.getElementById('kmb-search-status').innerText = '';
    switchBusTab('kmb');
    document.getElementById('kmb-settings-modal').classList.remove('hidden');
    document.getElementById('kmb-settings-modal').classList.add('flex');
}

function closeKmbSettings() {
    if (document.getElementById('kmb-sort-section').classList.contains('absolute')) { toggleExpandSort('kmb'); }
    
    localStorage.setItem('kmbStations', JSON.stringify(kmbSelected)); 
    document.getElementById('kmb-settings-modal').classList.add('hidden');
    document.getElementById('kmb-settings-modal').classList.remove('flex');
    fetchKMBData();
}

// ================= 港鐵設定視窗 =================
function openMtrSettings() {
    const modal = document.getElementById('mtr-settings-modal');
    const listContainer = document.getElementById('mtr-station-list-settings');
    listContainer.innerHTML = '';
    
    for (const [lineCode, lineInfo] of Object.entries(MTR_LINES)) {
        const stations = MTR_STATIONS_BY_LINE[lineCode];
        let html = `<div class="group-container mb-4"><h4 class="font-black text-sm mb-2 pb-1 border-b border-gray-200 dark:border-gray-700/60" style="color: ${lineInfo.color}">${lineInfo.name}</h4><div class="grid grid-cols-2 gap-2">`;
        
        for (const [sta, name] of Object.entries(stations)) {
            const isChecked = selectedMtrStations.includes(sta) ? 'checked' : '';
            html += `
                <label class="station-item flex items-center justify-between p-2.5 bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-[#3a3a3c] transition-colors cursor-pointer shadow-sm">
                    <span class="text-[13px] font-bold text-gray-800 dark:text-white truncate pr-1">${name}</span>
                    <input type="checkbox" value="${sta}" class="mtr-checkbox w-4 h-4 accent-[#ea2227] rounded flex-shrink-0" onchange="toggleMtrSelection('${sta}', this.checked)" ${isChecked}>
                </label>`;
        }
        html += `</div></div>`;
        listContainer.innerHTML += html;
    }
    renderMtrSortList();
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeMtrSettings() {
    if (selectedMtrStations.length === 0) { alert("請至少選擇一個港鐵站！"); return; }
    localStorage.setItem('mtrStations', JSON.stringify(selectedMtrStations)); 
    if (!selectedMtrStations.includes(currentMtrStationId)) currentMtrStationId = selectedMtrStations[0];
    document.getElementById('mtr-settings-modal').classList.add('hidden'); document.getElementById('mtr-settings-modal').classList.remove('flex');
    renderMtrTags(); fetchMTRData();
}

function toggleMtrSelection(sta, isChecked) {
    if (isChecked) { 
        if (!selectedMtrStations.includes(sta)) selectedMtrStations.push(sta); 
    } else { 
        selectedMtrStations = selectedMtrStations.filter(s => s !== sta); 
    }
    
    document.querySelectorAll(`.mtr-checkbox[value="${sta}"]`).forEach(cb => {
        cb.checked = isChecked;
    });

    renderMtrSortList();
}

function renderMtrSortList() {
    const list = document.getElementById('mtr-selected-sort-list');
    list.innerHTML = '';
    if(selectedMtrStations.length === 0) {
        document.getElementById('mtr-selected-count').innerText = 0; return;
    }
    selectedMtrStations.forEach((id, index) => {
        list.innerHTML += `
            <div class="flex items-center gap-1.5 bg-white dark:bg-[#1c2a3d] border border-gray-200 dark:border-gray-600 px-2 py-1.5 rounded-lg shadow-sm">
                <span class="text-xs font-bold text-gray-800 dark:text-gray-100">${MTR_STA_DICT[id] || id}</span>
                <div class="flex flex-col gap-0.5">
                    <button onclick="moveMtrSort(${index}, -1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}">▲</button>
                    <button onclick="moveMtrSort(${index}, 1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === selectedMtrStations.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}">▼</button>
                </div>
            </div>
        `;
    });
    document.getElementById('mtr-selected-count').innerText = selectedMtrStations.length;
}

function moveMtrSort(index, direction) {
    if (index + direction < 0 || index + direction >= selectedMtrStations.length) return;
    const temp = selectedMtrStations[index];
    selectedMtrStations[index] = selectedMtrStations[index + direction];
    selectedMtrStations[index + direction] = temp;
    renderMtrSortList();
}

// ================= 屯門公路轉車站 Popup 控制 (不變) =================
let tmClCurrentBound = 'outbound';
let tmclStopIds = { outbound: null, inbound: null };

async function findTmclStopIds() {
    if (tmclStopIds.outbound && tmclStopIds.inbound) return;
    try {
        if (typeof kmbStopsDict !== 'undefined' && Object.keys(kmbStopsDict).length === 0) await fetchAllKmbStops();
        
        const resO = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route-stop/60X/outbound/1');
        const dataO = await resO.json();
        const stopO = dataO.data.find(s => kmbStopsDict[s.stop]?.includes('屯門公路轉車站') || s.name_tc === '屯門公路轉車站');

        const resI = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route-stop/60X/inbound/1');
        const dataI = await resI.json();
        const stopI = dataI.data.find(s => kmbStopsDict[s.stop]?.includes('屯門公路轉車站') || s.name_tc === '屯門公路轉車站');

        if (stopO) tmclStopIds.inbound = stopO.stop;
        if (stopI) tmclStopIds.outbound = stopI.stop;
    } catch (e) {
        console.error("無法定位轉車站 ID", e);
    }
}

function openTmClPopup() {
    const modal = document.getElementById('tm-cl-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    
    switchTmClTab('outbound');
}

function closeTmClPopup() {
    const modal = document.getElementById('tm-cl-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function switchTmClTab(bound) {
    tmClCurrentBound = bound;
    const tabOutbound = document.getElementById('tm-cl-tab-outbound');
    const tabInbound = document.getElementById('tm-cl-tab-inbound');
    const container = document.getElementById('tm-cl-routes-container');
    const statusEl = document.getElementById('tm-cl-status');
    
    if (!tabOutbound || !tabInbound || !container) return;
    
    if (bound === 'outbound') {
        tabOutbound.className = "flex-1 py-2.5 text-sm font-bold text-[#ff453a] border-b-2 border-[#ff453a] transition-colors";
        tabInbound.className = "flex-1 py-2.5 text-sm font-bold text-gray-400 dark:text-gray-500 border-b-2 border-transparent transition-colors";
    } else {
        tabInbound.className = "flex-1 py-2.5 text-sm font-bold text-[#0a60ff] border-b-2 border-[#0a60ff] transition-colors";
        tabOutbound.className = "flex-1 py-2.5 text-sm font-bold text-gray-400 dark:text-gray-500 border-b-2 border-transparent transition-colors";
    }
    
    container.innerHTML = '<div class="flex flex-col items-center justify-center py-10 space-y-3 col-span-2"><div class="w-6 h-6 border-2 border-[#ff453a] border-t-transparent rounded-full animate-spin"></div><div class="text-sm text-gray-500 font-medium">正在同步實時班次...</div></div>';
    if (statusEl) statusEl.innerText = '';
    
    loadTmClEtas(bound);
}

async function loadTmClEtas(bound) {
    const container = document.getElementById('tm-cl-routes-container');
    const statusEl = document.getElementById('tm-cl-status');
    if (!container) return;
    
    container.innerHTML = '<div class="flex flex-col items-center justify-center py-10 space-y-3 col-span-2"><div class="w-6 h-6 border-2 border-[#ff453a] border-t-transparent rounded-full animate-spin"></div><div class="text-sm text-gray-500 font-medium">正在同步實時班次...</div></div>';
    if (statusEl) statusEl.innerText = '';
    
    try {
        await findTmclStopIds();
        const stopId = tmclStopIds[bound];
        if (!stopId) throw new Error("找不到轉車站 ID");

        const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`);
        const data = await res.json();
        
        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-8 font-medium col-span-2">暫無班次資料</div>';
            return;
        }
        
        const routesMap = {};
        data.data.forEach(d => {
            if (!d.eta) return;
            const key = `${d.route}-${d.dest_tc}`;
            if (!routesMap[key]) routesMap[key] = { route: d.route, dest: d.dest_tc, etas: [] };
            
            if (!routesMap[key].etas.includes(d.eta)) {
                routesMap[key].etas.push(d.eta);
            }
        });
        
        const validResults = Object.values(routesMap).map(r => {
            r.etas.sort((a, b) => new Date(a) - new Date(b));
            return { route: r.route, dest: r.dest, eta1: r.etas[0], eta2: r.etas[1] || null };
        });
        validResults.sort((a, b) => a.route.localeCompare(b.route, undefined, {numeric: true, sensitivity: 'base'}));
        
        let html = '<div class="grid grid-cols-2 gap-2 p-1 pb-4">';
        
        validResults.forEach(r => {
            const renderEtaBoard = (etaTimeStr) => {
                if (!etaTimeStr) return '<span class="text-gray-300 dark:text-gray-600 text-[10px] font-bold">--</span>';
                
                const etaTime = new Date(etaTimeStr);
                const diffMs = etaTime - new Date();
                let diffMins = Math.max(0, Math.floor(diffMs / 60000));
                let timeStr = `${String(etaTime.getHours()).padStart(2,'0')}:${String(etaTime.getMinutes()).padStart(2,'0')}`;
                
                if (diffMins <= 0) {
                    return `<span class="text-[#ff453a] font-black text-[12px] tracking-tighter animate-pulse">即將抵達</span><span class="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">${timeStr}</span>`;
                }
                return `<div class="flex items-baseline gap-0.5"><span class="text-gray-900 dark:text-white font-black text-[15px]">${diffMins}</span><span class="text-[9px] text-gray-500 font-bold">分</span></div><span class="text-[8px] text-gray-400 dark:text-gray-500">${timeStr}</span>`;
            };
            
            html += `
            <div class="bg-white dark:bg-[#2c2c2e] p-2 rounded-[14px] border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
                <div class="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-gray-50 dark:border-gray-700/50">
                    <div class="bg-gradient-to-br from-[#ff453a] to-[#d63a30] text-white font-black text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 text-center shadow-inner tracking-tight min-w-[34px]">${r.route}</div>
                    <div class="flex flex-col truncate pr-1">
                        <span class="text-[8px] text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase leading-none mb-0.5">往</span>
                        <span class="text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate leading-none">${r.dest}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex flex-col items-center w-1/2 border-r border-gray-100 dark:border-gray-700">${renderEtaBoard(r.eta1)}</div>
                    <div class="flex flex-col items-center w-1/2">${renderEtaBoard(r.eta2)}</div>
                </div>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        const now = new Date();
        if (statusEl) statusEl.innerText = `最後更新: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        
    } catch(e) {
        container.innerHTML = '<div class="text-center text-[#ff453a] py-8 text-sm font-bold bg-red-50 dark:bg-[#ff453a]/10 rounded-xl m-2 border border-red-100 dark:border-[#ff453a]/20 col-span-2">無法連接九巴伺服器，請重試</div>';
        console.error('loadTmClEtas error:', e);
    }
}

// ================= 初始化頁面定時重新整理 =================
window.onload = () => {
    updateAccordionUI(); 
    fetchWeather();
    fetchTrafficNews(); 
    renderLrtTags();
    fetchLRTData();
    renderMtrTags();
    fetchMTRData();
    fetchKMBData();
    
    setInterval(fetchWeather, 3 * 60 * 1000);
    setInterval(fetchTrafficNews, 60 * 1000); 
    setInterval(fetchLRTData, 30 * 1000);
    setInterval(fetchMTRData, 30 * 1000);
    setInterval(fetchKMBData, 30 * 1000);
};

// ================= 系統備份與還原功能 =================
const DASHBOARD_VERSION = "1.1";

function openSystemSettings() {
    const modal = document.getElementById('system-settings-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.getElementById('backup-text-area').value = '';
    document.getElementById('copy-btn').classList.add('hidden');
    document.getElementById('system-status-msg').innerText = '';
}

function closeSystemSettings() {
    const modal = document.getElementById('system-settings-modal');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function exportSettings() {
    const data = {
        lrtStations: localStorage.getItem('lrtStations') ? JSON.parse(localStorage.getItem('lrtStations')) : [],
        kmbStations: localStorage.getItem('kmbStations') ? JSON.parse(localStorage.getItem('kmbStations')) : [],
        mtrStations: localStorage.getItem('mtrStations') ? JSON.parse(localStorage.getItem('mtrStations')) : [],
        theme: localStorage.getItem('theme') || 'light'
    };
    
    const base64Data = btoa(encodeURIComponent(JSON.stringify(data)));
    
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const backupString = `[備份日期: ${dateString}]\n[版本: ${DASHBOARD_VERSION}]\n--請複製以下整段文字--\n${base64Data}`;
    
    const textArea = document.getElementById('backup-text-area');
    textArea.value = backupString;
    document.getElementById('copy-btn').classList.remove('hidden');
    
    showSystemStatus('備份文字已產生！請點擊複製。', '#0a60ff', '#64d2ff');
}

function copyBackupText() {
    const textArea = document.getElementById('backup-text-area');
    textArea.select();
    document.execCommand('copy');
    showSystemStatus('✅ 已複製到剪貼簿！可以去 WhatsApp 貼上', '#34c759', '#34c759');
}

function importSettings() {
    const textArea = document.getElementById('backup-text-area');
    const text = textArea.value.trim();
    
    if (!text) {
        showSystemStatus('❌ 請先在上方貼上備份文字！', '#ff453a', '#ff453a');
        return;
    }
    
    try {
        const lines = text.split('\n');
        let base64String = '';
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() !== '' && !lines[i].startsWith('[')) {
                base64String = lines[i].trim();
                break;
            }
        }

        if (!base64String) throw new Error("找不到有效的設定資料");

        const decodedData = JSON.parse(decodeURIComponent(atob(base64String)));
        
        if (decodedData.lrtStations) {
            localStorage.setItem('lrtStations', JSON.stringify(decodedData.lrtStations));
            selectedStations = decodedData.lrtStations;
            if (selectedStations.length > 0) currentStationId = selectedStations[0];
        }
        
        if (decodedData.kmbStations) {
            localStorage.setItem('kmbStations', JSON.stringify(decodedData.kmbStations));
            kmbSelected = decodedData.kmbStations;
        }
        
        if (decodedData.mtrStations) {
            localStorage.setItem('mtrStations', JSON.stringify(decodedData.mtrStations));
            selectedMtrStations = decodedData.mtrStations;
            if (selectedMtrStations.length > 0) currentMtrStationId = selectedMtrStations[0];
        }
        
        if (decodedData.theme) {
            localStorage.setItem('theme', decodedData.theme);
            if (decodedData.theme === 'dark') document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            updateThemeIcon();
        }

        showSystemStatus('✅ 設定還原成功！正在重新載入...', '#34c759', '#34c759');
        
        setTimeout(() => {
            renderLrtTags();
            fetchLRTData();
            renderMtrTags();
            fetchMTRData();
            fetchKMBData();
            closeSystemSettings();
        }, 1500);

    } catch (e) {
        console.error(e);
        showSystemStatus('❌ 還原失敗：備份文字格式不正確或已損毀！', '#ff453a', '#ff453a');
    }
}

function showSystemStatus(msg, lightColor, darkColor) {
    const statusDiv = document.getElementById('system-status-msg');
    statusDiv.innerText = msg;
    statusDiv.style.color = document.documentElement.classList.contains('dark') ? darkColor : lightColor;
}

// ================= 排序視窗放大/縮小控制 =================
function toggleExpandSort(type) {
    const sectionId = type === 'lrt' ? 'lrt-sort-section' : type === 'kmb' ? 'kmb-sort-section' : 'mtr-sort-section';
    const listId = type === 'lrt' ? 'selected-sort-list' : type === 'kmb' ? 'kmb-selected-sort-list' : 'mtr-selected-sort-list';
    const btnId = type === 'lrt' ? 'lrt-sort-expand-btn' : type === 'kmb' ? 'kmb-sort-expand-btn' : 'mtr-sort-expand-btn';
    
    const section = document.getElementById(sectionId);
    const list = document.getElementById(listId);
    const btn = document.getElementById(btnId);
    
    const isExpanded = section.classList.contains('absolute');
    
    if (!isExpanded) {
        section.className = "absolute inset-0 z-50 bg-white dark:bg-[#1c1c1e] p-5 pt-12 flex flex-col h-[100dvh] rounded-none m-0 animate-fade-in";
        list.className = "flex flex-wrap content-start gap-2 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto scroll-area mt-3 shadow-inner";
        btn.innerText = "縮小 ✖️";
        btn.className = "text-[11px] text-red-600 dark:text-red-400 font-bold px-3 py-1 bg-red-100 dark:bg-red-500/20 rounded-full active:scale-95 transition-transform shadow-sm";
    } else {
        section.className = "mb-4 flex-shrink-0 flex flex-col transition-all";
        list.className = "flex flex-wrap gap-2 p-2.5 bg-gray-50 dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-gray-700 min-h-[55px] max-h-[120px] overflow-y-auto scroll-area";
        btn.innerText = "放大 🔍";
        btn.className = "text-[10px] text-blue-600 dark:text-blue-500 font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 rounded-md active:scale-95 transition-transform";
    }
}