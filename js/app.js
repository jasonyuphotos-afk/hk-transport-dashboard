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
}

function toggleLRT() {
    lrtExpanded = !lrtExpanded;
    if (lrtExpanded) kmbExpanded = false; 
    updateAccordionUI();
}

function toggleKMB() {
    kmbExpanded = !kmbExpanded;
    if (kmbExpanded) lrtExpanded = false; 
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
    localStorage.setItem('lrtStations', JSON.stringify(selectedStations)); 
    if (!selectedStations.includes(currentStationId)) currentStationId = selectedStations[0];
    document.getElementById('settings-modal').classList.add('hidden'); document.getElementById('settings-modal').classList.remove('flex');
    renderLrtTags(); fetchLRTData();
}

function switchBusTab(type) {
    const tabKmb = document.getElementById('tab-kmb');
    const tabGmb = document.getElementById('tab-gmb');
    const panelKmb = document.getElementById('search-panel-kmb');
    const panelGmb = document.getElementById('search-panel-gmb');
    const statusEl = document.getElementById('kmb-search-status');
    const container = document.getElementById('kmb-route-results');
    
    statusEl.innerText = '';
    container.innerHTML = '';

    if (type === 'kmb') {
        tabKmb.className = "flex-1 py-2 text-sm font-bold text-[#ff453a] border-b-2 border-[#ff453a] transition-colors";
        tabGmb.className = "flex-1 py-2 text-sm font-bold text-gray-500 dark:text-gray-500 border-b-2 border-transparent transition-colors";
        panelKmb.classList.remove('hidden');
        panelGmb.classList.add('hidden');
    } else {
        tabGmb.className = "flex-1 py-2 text-sm font-bold text-[#34c759] border-b-2 border-[#34c759] transition-colors";
        tabKmb.className = "flex-1 py-2 text-sm font-bold text-gray-500 dark:text-gray-500 border-b-2 border-transparent transition-colors";
        panelGmb.classList.remove('hidden');
        panelKmb.classList.add('hidden');
    }
}

function openKmbSettings() {
    renderKmbSortList();
    document.getElementById('kmb-route-input').value = '';
    document.getElementById('gmb-route-input').value = '';
    document.getElementById('kmb-route-results').innerHTML = '';
    document.getElementById('kmb-search-status').innerText = '';
    switchBusTab('kmb');
    document.getElementById('kmb-settings-modal').classList.remove('hidden');
    document.getElementById('kmb-settings-modal').classList.add('flex');
}

function closeKmbSettings() {
    localStorage.setItem('kmbStations', JSON.stringify(kmbSelected)); 
    document.getElementById('kmb-settings-modal').classList.add('hidden');
    document.getElementById('kmb-settings-modal').classList.remove('flex');
    fetchKMBData();
}

// ================= 初始化頁面定時重新整理 =================
window.onload = () => {
    updateAccordionUI(); 
    fetchWeather();
    fetchTrafficNews(); 
    renderLrtTags();
    fetchLRTData();
    fetchKMBData();
    
    setInterval(fetchWeather, 3 * 60 * 1000);
    setInterval(fetchTrafficNews, 60 * 1000); 
    setInterval(fetchLRTData, 30 * 1000);
    setInterval(fetchKMBData, 30 * 1000);
};

// ================= 系統備份與還原功能 =================
const DASHBOARD_VERSION = "1.0";

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