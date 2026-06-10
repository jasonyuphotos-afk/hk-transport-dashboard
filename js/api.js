// ================= 輕鐵資料區 =================
const STATION_GROUPS = {
    "屯門碼頭及周邊": { '001': '屯門碼頭', '010': '美樂', '015': '蝴蝶', '020': '輕鐵車廠', '030': '龍門', '040': '青山村', '050': '青雲', '060': '建安', '240': '兆禧', '250': '屯門泳池', '260': '豐景園' },
    "屯門市中心": { '265': '兆麟', '270': '安定', '275': '友愛', '280': '市中心', '295': '屯門', '300': '杯渡', '310': '何福堂', '320': '新墟', '330': '景峰' },
    "大興及良田": { '070': '河田', '075': '蔡意橋', '080': '澤豐', '130': '建生', '140': '田景', '150': '良景', '160': '新圍', '170': '石排', '180': '鳴琴', '190': '大興(北)', '200': '大興(南)', '210': '銀圍' },
    "兆康及洪水橋": { '090': '屯門醫院', '100': '兆康', '110': '麒麟', '120': '青松', '340': '鳳地', '350': '泥圍', '360': '藍地', '370': '鍾屋村', '380': '洪水橋', '390': '坑尾村' },
    "天水圍": { '430': '天水圍', '445': '天慈', '448': '天湖', '450': '銀座', '460': '天瑞', '480': '天耀', '490': '樂湖', '500': '天榮', '510': '頌富', '520': '天富', '530': '天逸', '540': '天恆', '550': '濕地公園', '560': '天秀' },
    "元朗": { '400': '屏山', '425': '塘坊村', '570': '水邊圍', '580': '豐年路', '590': '康樂路', '600': '大棠路', '610': '元朗' }
};

const STATION_DICT = Object.values(STATION_GROUPS).reduce((acc, curr) => ({ ...acc, ...curr }), {});

let savedLrtStations = JSON.parse(localStorage.getItem('lrtStations'));
let selectedStations = ['260', '001', '270', '275'];
if (savedLrtStations && Array.isArray(savedLrtStations)) {
    let validStations = savedLrtStations.filter(id => STATION_DICT[id]);
    if (validStations.length > 0) selectedStations = validStations;
}
let currentStationId = selectedStations[0];
localStorage.setItem('lrtStations', JSON.stringify(selectedStations));

let fullTrafficText = "";

// ================= 九巴/小巴資料區 =================
let kmbStopsDict = {}; 
let gmbStopsDict = {}; 
let kmbSelected = JSON.parse(localStorage.getItem('kmbStations')) || [];
let kmbRoutesList = []; 

// ================= API 數據獲取與處理邏輯 =================
async function fetchWeather() {
   const now = new Date();
    document.getElementById('weather-refresh-time').innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    try {
        const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc');
        const data = await res.json();
        const tmTemp = data.temperature.data.find(d => d.place === '屯門');
        if (tmTemp) document.getElementById('weather-temp').innerText = tmTemp.value;
        
        let detailsHTML = '';
        if (data.humidity && data.humidity.data[0]) detailsHTML += `<div>濕度 ${data.humidity.data[0].value}%</div>`;
        if (data.rainfall && data.rainfall.data) {
            const tmRain = data.rainfall.data.find(d => d.place === '屯門');
            if (tmRain && tmRain.max > 0) detailsHTML += `<div>降雨 ${tmRain.max}mm</div>`;
        }
        if (data.uvindex && data.uvindex.data && data.uvindex.data.length > 0) detailsHTML += `<div>UV ${data.uvindex.data[0].value}</div>`;
        document.getElementById('weather-details').innerHTML = detailsHTML || '<div>-</div>';

        const warnRes = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc');
        const warnData = await warnRes.json();
        const warnIcon = document.getElementById('weather-warning-icon');
        const warnModalText = document.getElementById('warning-modal-text');
        
        if (Object.keys(warnData).length > 0) {
            warnIcon.classList.remove('hidden');
            let warnings = [];
            for (let key in warnData) { warnings.push(`<div class="bg-[#ff453a]/10 border border-[#ff453a]/30 p-3 rounded-xl text-[#ff453a] font-bold text-sm mb-2 shadow-inner">・${warnData[key].name}</div>`); }
            warnModalText.innerHTML = warnings.join('');
        } else {
            warnIcon.classList.add('hidden');
            warnModalText.innerHTML = '<div class="text-gray-400 text-center py-6">目前沒有生效的天氣警告</div>';
        }

        const flwRes = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw&lang=tc');
        const flwData = await flwRes.json();
        if (flwData.generalSituation) document.getElementById('weather-desc').innerText = flwData.generalSituation;
        if (flwData.forecastDesc) document.getElementById('weather-forecast').innerText = flwData.forecastDesc;

        const fndRes = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc');
        const fndData = await fndRes.json();
        if (fndData.generalSituation) document.getElementById('weather-outlook').innerText = fndData.generalSituation;
        if (fndData.weatherForecast && fndData.weatherForecast.length > 0) {
            const today = fndData.weatherForecast[0];
            const minTemp = today.forecastMintemp.value;
            const maxTemp = today.forecastMaxtemp.value;
            document.getElementById('weather-min-max').innerText = ` ${minTemp}°C /  ${maxTemp}°C`;
        }
        
    } catch (err) { console.error("天氣 API 錯誤", err); }
}

async function fetchTrafficNews() {
    const now = new Date();
    const trafficTimeEl = document.getElementById('traffic-refresh-time');
    if (trafficTimeEl) {
        trafficTimeEl.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    try {
        const res = await fetch('https://resource.data.one.gov.hk/td/en/specialtrafficnews.xml?t=' + new Date().getTime());
        const text = await res.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const messages = xml.getElementsByTagName('message'); 
        
        let fullText = "";
        let previewText = "";
        
        if (messages.length > 0) {
            const firstChinText = messages[0].getElementsByTagName("ChinText")[0]?.textContent || "";
            previewText = firstChinText.trim();
            
            for (let i = 0; i < messages.length; i++) {
                const chinText = messages[i].getElementsByTagName("ChinText")[0]?.textContent || "";
                const refDate = messages[i].getElementsByTagName("ReferenceDate")[0]?.textContent || "";
                if (chinText.trim()) {
                    fullText += `【發佈時間: ${refDate.trim()}】\n${chinText.trim()}\n\n`;
                }
            }
        }
        
        if (!fullText) {
            fullText = "✅ 目前交通大致正常，沒有特別消息。";
            previewText = "✅ 目前交通大致正常，沒有特別消息。";
        }
        
        fullTrafficText = fullText.trim();
        const previewEl = document.getElementById('traffic-news-preview');
        const readMoreEl = document.getElementById('traffic-read-more');
        const readMoreTextEl = document.getElementById('traffic-read-more-text');
        
        previewEl.innerText = previewText;
        document.getElementById('traffic-modal-text').innerText = fullTrafficText;
        
        if (messages.length > 1 || previewText.length > 50) {
            readMoreEl.style.display = 'block';
            if (readMoreTextEl && messages.length > 1) {
                readMoreTextEl.innerText = `點擊查看全部消息 (${messages.length} 條) 👉`;
            } else if (readMoreTextEl) {
                readMoreTextEl.innerText = '點擊閱讀全文 👉';
            }
        } else {
            readMoreEl.style.display = 'none';
        }
    } catch (err) {
        console.error("交通消息讀取錯誤", err);
        document.getElementById('traffic-news-preview').innerText = "暫時無法獲取交通消息。";
        document.getElementById('traffic-read-more').style.display = 'none';
    }
}

// ================= 輕鐵邏輯 =================
function renderLrtTags() {
    const container = document.getElementById('lrt-tags-container');
    container.innerHTML = '';
    selectedStations.forEach(id => {
        const isActive = id === currentStationId;
        const btnClass = isActive ? 'tag-active border' : 'tag-inactive border';
        const btn = document.createElement('button');
        btn.className = `px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${btnClass}`;
        btn.innerText = STATION_DICT[id] || `車站 ${id}`;
        btn.onclick = () => { currentStationId = id; renderLrtTags(); fetchLRTData(); };
        container.appendChild(btn);
    });
}

async function fetchLRTData() {
    if(!currentStationId) return;
    document.getElementById('lrt-current-station-name').innerText = `${STATION_DICT[currentStationId] || '未知'}站`;
    const container = document.getElementById('lrt-platforms-container');
    
    const now = new Date();
    document.getElementById('lrt-refresh-time').innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
        const res = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=${currentStationId}`);
        const data = await res.json();
        container.innerHTML = ''; 

        if (data.status !== 1 || !data.platform_list || data.platform_list.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-400 col-span-2 py-2 text-center">目前沒有班次資料或暫停服務。</div>';
            return;
        }

        data.platform_list.forEach(platform => {
            let platformHtml = `
            <div class="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full shadow-sm dark:shadow-none">
                <div class="bg-blue-50 dark:bg-[#1c2a3d] p-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
                    <div class="bg-[#0a60ff] text-white w-5 h-5 rounded flex justify-center items-center font-bold text-xs">${platform.platform_id}</div>
                    <div class="text-xs font-bold text-gray-800 dark:text-gray-200">月台</div>
                </div>
                <div class="p-2 space-y-2 flex-grow">
            `;

            if (!platform.route_list || platform.route_list.length === 0) {
                platformHtml += `<div class="text-[10px] text-gray-500 text-center py-2">暫無班次</div>`;
            } else {
                platform.route_list.forEach((route, index) => {
                    let trainEmoji = route.train_length == 1 ? '🚃' : (route.train_length == 2 ? '🚃🚃' : '');
                    const trainBadgeHtml = trainEmoji ? `<span class="ml-1 text-[13px]">${trainEmoji}</span>` : '';
                    
                    let timeText = route.time_ch;
                    let exactTime = '--:--';
                    let minsVal = 999;

                    if (!timeText || timeText === '-' || timeText.includes('離開') || timeText.includes('即將抵達')) {
                        timeText = '即將抵達';
                        minsVal = 0;
                        const nowTime = new Date();
                        exactTime = `${String(nowTime.getHours()).padStart(2,'0')}:${String(nowTime.getMinutes()).padStart(2,'0')}`;
                    } else {
                        const match = timeText.match(/(\d+)/);
                        if (match) {
                            minsVal = parseInt(match[1], 10);
                            timeText = `${minsVal} 分鐘`;
                            const futureTime = new Date(new Date().getTime() + minsVal * 60000);
                            exactTime = `${String(futureTime.getHours()).padStart(2,'0')}:${String(futureTime.getMinutes()).padStart(2,'0')}`;
                        }
                    }

                    const timeClass = (minsVal <= 2) ? 'text-[#ff453a]' : 'text-blue-600 dark:text-[#64d2ff]';
                    const borderTopClass = index > 0 ? 'border-t border-gray-200 dark:border-gray-800 pt-2 mt-2' : '';

                    platformHtml += `
                    <div class="flex justify-between items-end ${borderTopClass}">
                        <div class="flex-1">
                            <div class="text-blue-600 dark:text-[#64d2ff] font-bold text-base leading-tight flex items-center flex-wrap gap-y-1"><span class="mr-1">${route.route_no}</span>${trainBadgeHtml}</div>
                            <div class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 truncate pr-1">往 ${route.dest_ch || '未知'}</div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <div class="${timeClass} font-bold text-sm leading-none">${timeText}</div>
                            <div class="text-[9px] text-gray-500 mt-1">${exactTime}</div>
                        </div>
                    </div>`;
                });
            }
            platformHtml += `</div></div>`;
            container.innerHTML += platformHtml;
        });
    } catch (err) { container.innerHTML = '<div class="text-xs text-red-400 col-span-2 text-center">無法連接網路，請稍後再試。</div>'; }
}

function renderSortList() {
    const list = document.getElementById('selected-sort-list');
    list.innerHTML = '';
    if(selectedStations.length === 0) {
        list.innerHTML = '<span class="text-xs text-gray-500 my-auto ml-2">尚未選擇車站</span>';
        document.getElementById('selected-count').innerText = 0;
        return;
    }
    selectedStations.forEach((id, index) => {
        list.innerHTML += `
            <div class="flex items-center gap-1.5 bg-white dark:bg-[#1c2a3d] border border-blue-200 dark:border-blue-500/40 px-2 py-1.5 rounded-lg shadow-sm">
                <span class="text-sm font-bold text-gray-800 dark:text-gray-100">${STATION_DICT[id] || id}</span>
                <div class="flex flex-col gap-0.5">
                    <button onclick="moveSort(${index}, -1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}">▲</button>
                    <button onclick="moveSort(${index}, 1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === selectedStations.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}">▼</button>
                </div>
            </div>
        `;
    });
    document.getElementById('selected-count').innerText = selectedStations.length;
}

function moveSort(index, direction) {
    if (index + direction < 0 || index + direction >= selectedStations.length) return;
    const temp = selectedStations[index];
    selectedStations[index] = selectedStations[index + direction];
    selectedStations[index + direction] = temp;
    renderSortList();
}

function toggleStationSelection(id, isChecked) {
    if (isChecked) { if (!selectedStations.includes(id)) selectedStations.push(id); } 
    else { selectedStations = selectedStations.filter(s => s !== id); }
    renderSortList();
}

function filterStations() {
    const query = document.getElementById('station-search').value.toLowerCase();
    document.querySelectorAll('.group-container').forEach(group => {
        let hasVisible = false;
        group.querySelectorAll('.station-item').forEach(item => {
            if (item.getAttribute('data-name').includes(query) || item.getAttribute('data-id').includes(query)) { item.style.display = 'flex'; hasVisible = true; } 
            else { item.style.display = 'none'; }
        });
        group.style.display = hasVisible ? 'block' : 'none';
    });
}

// ================= 九巴/小巴邏輯 =================
async function fetchAllKmbStops() {
    if(Object.keys(kmbStopsDict).length > 0) return;
    try {
        const res = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
        const data = await res.json();
        data.data.forEach(stop => { kmbStopsDict[stop.stop] = stop.name_tc; });
    } catch (e) {}
}

async function fetchAllKmbRoutes() {
    if (kmbRoutesList.length > 0) return;
    try {
        const res = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
        const data = await res.json();
        if (data.data) {
            kmbRoutesList = data.data;
        }
    } catch (e) {}
}

async function fetchKMBData() {
    const container = document.getElementById('kmb-container');
    const now = new Date();
    document.getElementById('kmb-refresh-time').innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (kmbSelected.length === 0) {
        container.innerHTML = '<div class="col-span-2 text-center py-6 text-gray-500 text-xs border border-gray-200 dark:border-gray-800 rounded-xl">請點擊 ⚙️ 設定加入巴士或小巴路線</div>';
        return;
    }

    container.innerHTML = kmbSelected.map((item, i) => `<div id="bus-card-${i}" class="bg-white dark:bg-[#1c1c1e] rounded-xl h-[135px] flex items-center justify-center border border-gray-200 dark:border-gray-800"><span class="text-xs text-gray-500 animate-pulse">載入中...</span></div>`).join('');

    kmbSelected.forEach(async (item, i) => {
        const html = await buildBusCardHtml(item);
        const card = document.getElementById(`bus-card-${i}`);
        if (card) card.outerHTML = html;
    });
}

async function buildBusCardHtml(item) {
    try {
        let etas = [];
        const isGmb = item.company === 'gmb';
        
        if (isGmb) {
            const res = await fetch(`https://data.etagmb.gov.hk/eta/stop/${item.stopId}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const targetRoute = json.data.find(d => d.route_id == item.routeId && d.route_seq == item.dir);
                    if (targetRoute && targetRoute.eta) {
                        etas = targetRoute.eta
                            .filter(d => d.timestamp !== null)
                            .map(d => ({ eta: d.timestamp }))
                            .sort((a, b) => new Date(a.eta) - new Date(b.eta));
                    }
                }
            }
        } else {
            const serviceType = item.serviceType || '1';
            const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${item.stopId}/${item.route}/${serviceType}`);
            const json = await res.json();
            if(json.data) {
                etas = json.data
                    .filter(d => d.dir === item.dir && d.eta !== null)
                    .sort((a, b) => new Date(a.eta) - new Date(b.eta));
            }
        }

        let eta1 = etas[0];
        let eta2 = etas[1];

        const borderColorClass = isGmb ? 'border-[#34c759]' : 'border-[#ff453a]';
        const textColorClass = isGmb ? 'text-[#34c759]' : 'text-[#ff453a]';
        const bgColorClass = isGmb ? 'bg-[#34c759]' : 'bg-[#ff453a]';

        const renderRow = (label, etaObj) => {
            if (!etaObj || !etaObj.eta) {
                return `
                <div class="border-l-2 ${borderColorClass} pl-2 flex justify-between items-center h-[42px] mt-1.5">
                    <span class="text-gray-500 dark:text-gray-400 text-[10px] whitespace-nowrap">${label}</span>
                    <div class="text-gray-400 dark:text-gray-500 font-bold text-xs">沒有班次</div>
                </div>`;
            }

            const etaTime = new Date(etaObj.eta);
            const now = new Date();
            const diffMs = etaTime - now;
            let diffMins = Math.max(0, Math.floor(diffMs / 60000));
            let timeStr = `${String(etaTime.getHours()).padStart(2,'0')}:${String(etaTime.getMinutes()).padStart(2,'0')}`;
            
            let minHtml = '';
            if (diffMins <= 0) {
                minHtml = `<span class="text-sm tracking-tight ${textColorClass}">即將抵達</span>`;
            } else {
                minHtml = `<span class="text-2xl ${textColorClass}">${diffMins}</span><span class="text-[10px] ml-0.5 ${textColorClass} font-normal">分</span>`;
            }

            return `
            <div class="border-l-2 ${borderColorClass} pl-2 flex justify-between items-center h-[42px] mt-1.5">
                <span class="text-gray-500 dark:text-gray-400 text-[10px] whitespace-nowrap">${label}</span>
                <div class="text-right flex flex-col justify-center">
                    <div class="font-bold leading-none mb-1 flex items-baseline justify-end">${minHtml}</div>
                    <div class="text-gray-500 text-[9px] leading-none">${timeStr}</div>
                </div>
            </div>`;
        };

        return `
        <div class="bg-white dark:bg-[#1c1c1e] rounded-xl p-2.5 border border-gray-200 dark:border-gray-800 flex flex-col shadow-sm">
            <div class="flex gap-1.5 items-center mb-1 overflow-hidden">
                <div class="${bgColorClass} text-white font-bold text-xl px-1.5 py-0.5 rounded shadow-sm leading-none tracking-tighter flex-shrink-0">${item.route}</div>
                <div class="flex flex-col leading-tight overflow-hidden">
                    <span class="text-gray-1200 dark:text-white font-bold text-[13px] truncate">往 ${item.dest}</span>
                    <span class="text-gray-500 dark:text-gray-400 text-[10px] truncate">${item.stopName}</span>
                </div>
            </div>
            ${renderRow('下一班', eta1)}
            ${renderRow('第二班', eta2)}
        </div>`;
    } catch (e) {
        return `<div class="bg-white dark:bg-[#1c1c1e] rounded-xl h-[135px] flex items-center justify-center border border-red-500/50 text-xs text-red-500 shadow-sm">載入錯誤</div>`;
    }
}

async function searchKmbRoute() {
    const routeInput = document.getElementById('kmb-route-input').value.trim().toUpperCase();
    if(!routeInput) return;
    
    const statusEl = document.getElementById('kmb-search-status');
    const container = document.getElementById('kmb-route-results');
    container.innerHTML = '';
    statusEl.innerText = '正在搜尋九巴...';
    statusEl.className = "text-center text-[#ff453a] font-bold text-xs mb-2";

    try {
        await fetchAllKmbStops(); 
        await fetchAllKmbRoutes();
        const matchedRoutes = kmbRoutesList.filter(r => r.route === routeInput);
        if(matchedRoutes.length > 0) {
            await renderKmbSearchResults(matchedRoutes, routeInput, container);
            statusEl.innerText = '搜尋完成！';
        } else {
            statusEl.innerText = `找不到九巴路線 (${routeInput})`;
        }
    } catch (e) {
        console.error(e);
        statusEl.innerText = "搜尋錯誤，請重試。";
    }
}

async function searchGmbRoute() {
    const routeInput = document.getElementById('gmb-route-input').value.trim().toUpperCase();
    if(!routeInput) return;
    
    const statusEl = document.getElementById('kmb-search-status');
    const container = document.getElementById('kmb-route-results');
    container.innerHTML = '';
    statusEl.innerText = '正在搜尋小巴...';
    statusEl.className = "text-center text-[#34c759] font-bold text-xs mb-2";

    let foundGmb = false;
    const regions = ['NT', 'KLN', 'HKI'];
    
    for (const region of regions) {
        try {
            const mbRes = await fetch(`https://data.etagmb.gov.hk/route/${region}/${routeInput}`);
            if (!mbRes.ok) continue;
            const mbData = await mbRes.json();
            
            if (mbData.data && mbData.data.length > 0) {
                foundGmb = true;
                await renderGmbSearchResults(mbData.data, routeInput, container);
            }
        } catch(e) { console.error("GMB Search Error:", e); }
    }

    if(foundGmb) {
        statusEl.innerText = '搜尋完成！';
    } else {
        statusEl.innerText = `找不到小巴路線 (${routeInput})`;
    }
}

async function renderKmbSearchResults(routes, routeCode, container) {
    for (const r of routes) {
        const dest = r.dest_tc;
        const orig = r.orig_tc;
        const dirParam = r.bound.toLowerCase() === 'i' ? 'inbound' : 'outbound';

        const stopRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeCode}/${dirParam}/${r.service_type}`);
        const stopData = await stopRes.json();

        if (!stopData.data || stopData.data.length === 0) continue;

        let html = `
        <div class="mt-4 bg-red-50 dark:bg-[#1c2a3d]/30 p-3 rounded-xl border border-red-200 dark:border-red-500/30">
            <h4 class="text-[#ff453a] font-bold text-sm mb-3 pb-2 border-b border-gray-200 dark:border-gray-700/60 flex items-center gap-2">
                <span class="bg-[#ff453a] text-white px-1.5 py-0.5 rounded text-[10px]">九巴</span> 往 ${dest} <span class="text-[10px] text-gray-500 font-normal ml-1">(${orig} 開出)</span>
            </h4>
            <div class="space-y-2">
        `;

        stopData.data.forEach(stopObj => {
            const stopName = kmbStopsDict[stopObj.stop] || stopObj.stop;
            const idStr = `${routeCode}_${r.bound}_${r.service_type}_${stopObj.stop}`;
            const isChecked = kmbSelected.some(s => s.id === idStr) ? 'checked' : '';

            const itemData = encodeURIComponent(JSON.stringify({
                id: idStr,
                company: 'kmb',
                route: routeCode,
                dir: r.bound,
                serviceType: r.service_type,
                stopId: stopObj.stop,
                stopName: stopName,
                dest: dest
            }));

            html += `
                <label class="flex items-center justify-between p-2 bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-[#3a3a3c] transition-colors cursor-pointer">
                    <span class="text-xs text-gray-800 dark:text-gray-200 truncate pr-2 flex items-center gap-2">
                        <span class="bg-gray-200 dark:bg-gray-700 text-[9px] w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 text-gray-700 dark:text-gray-300 font-bold">${stopObj.seq}</span>
                        ${stopName}
                    </span>
                    <input type="checkbox" value="${itemData}" class="w-4 h-4 accent-[#ff453a] rounded flex-shrink-0" onchange="toggleBusSelection(this)" ${isChecked}>
                </label>
            `;
        });
        html += `</div></div>`;
        container.insertAdjacentHTML('beforeend', html);
    }
}

async function renderGmbSearchResults(routes, routeCode, container) {
    for (const r of routes) {
        const routeId = r.route_id;
        
        let directions = r.directions;
        if (!directions) {
            try {
                const detailRes = await fetch(`https://data.etagmb.gov.hk/route/${routeId}`);
                const detailData = await detailRes.json();
                if (detailData.data && detailData.data.directions) directions = detailData.data.directions;
            } catch(e) {}
        }
        if (!directions) continue;

        for (const dir of directions) {
            const seq = dir.route_seq;
            const dest = dir.dest_tc;
            const orig = dir.orig_tc;
            
            try {
                const stopRes = await fetch(`https://data.etagmb.gov.hk/route-stop/${routeId}/${seq}`);
                const stopData = await stopRes.json();
                
                let stops = stopData.data.route_stops || stopData.data; 
                if (!stops || stops.length === 0) continue;

                const uniqueId = `gmb-stops-${routeId}-${seq}`;
                
                let baseHtml = `
                <div class="mt-4 bg-green-50 dark:bg-[#1c2a3d]/30 p-3 rounded-xl border border-green-200 dark:border-[#34c759]/40 relative">
                    <h4 class="text-[#34c759] font-bold text-sm mb-3 pb-2 border-b border-gray-200 dark:border-gray-700/60 flex items-center gap-2">
                        <span class="bg-[#34c759] text-white px-1.5 py-0.5 rounded text-[10px]">綠小</span> 往 ${dest} <span class="text-[10px] text-gray-500 font-normal ml-1">(${orig} 開出)</span>
                    </h4>
                    <div class="space-y-2" id="${uniqueId}">
                        <div class="text-[11px] text-[#34c759] text-center py-3 animate-pulse bg-[#34c759]/10 rounded-lg">正在載入小巴站點...</div>
                    </div>
                </div>
                `;
                container.insertAdjacentHTML('beforeend', baseHtml);

                const stopsContainer = document.getElementById(uniqueId);
                let stopsHtml = '';

                for (const stopObj of stops) {
                    let stopName = gmbStopsDict[stopObj.stop_id];
                    
                    if (!stopName) {
                        if (stopObj.name_tc) {
                            stopName = stopObj.name_tc;
                            gmbStopsDict[stopObj.stop_id] = stopName;
                        } else if (stopObj.name && stopObj.name.tc) {
                            stopName = stopObj.name.tc;
                            gmbStopsDict[stopObj.stop_id] = stopName;
                        } else {
                            try {
                                const sRes = await fetch(`https://data.etagmb.gov.hk/stop/${stopObj.stop_id}`);
                                if (sRes.ok) {
                                    const sData = await sRes.json();
                                    stopName = sData.data.name_tc || `車站 ${stopObj.stop_id}`;
                                    gmbStopsDict[stopObj.stop_id] = stopName;
                                } else {
                                    stopName = `車站 ${stopObj.stop_id}`;
                                }
                            } catch(e) { stopName = `車站 ${stopObj.stop_id}`; }
                        }
                    }

                    const idStr = `gmb_${routeId}_${seq}_${stopObj.stop_id}`;
                    const isChecked = kmbSelected.some(s => s.id === idStr) ? 'checked' : '';

                    const itemData = encodeURIComponent(JSON.stringify({
                        id: idStr,
                        company: 'gmb',
                        routeId: routeId,
                        route: r.route_code || routeCode,
                        dir: seq,
                        stopId: stopObj.stop_id,
                        stopName: stopName,
                        dest: dest
                    }));

                    stopsHtml += `
                        <label class="flex items-center justify-between p-2 bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-[#3a3a3c] transition-colors cursor-pointer">
                            <span class="text-xs text-gray-800 dark:text-gray-200 truncate pr-2 flex items-center gap-2">
                                <span class="bg-gray-200 dark:bg-gray-700 text-[9px] w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 text-gray-700 dark:text-gray-300 font-bold">${stopObj.stop_seq || ''}</span>
                                ${stopName}
                            </span>
                            <input type="checkbox" value="${itemData}" class="w-4 h-4 accent-[#34c759] rounded flex-shrink-0" onchange="toggleBusSelection(this)" ${isChecked}>
                        </label>
                    `;
                }
                
                if(stopsContainer) stopsContainer.innerHTML = stopsHtml;

            } catch(e) {}
        }
    }
}

function toggleBusSelection(checkbox) {
    const data = JSON.parse(decodeURIComponent(checkbox.value));
    if (checkbox.checked) {
        if (!kmbSelected.some(s => s.id === data.id)) kmbSelected.push(data);
    } else {
        kmbSelected = kmbSelected.filter(s => s.id !== data.id);
    }
    renderKmbSortList();
}

function renderKmbSortList() {
    const list = document.getElementById('kmb-selected-sort-list');
    list.innerHTML = '';
    if(kmbSelected.length === 0) {
        list.innerHTML = '<span class="text-xs text-gray-500 my-auto ml-2">尚未選擇站點</span>';
        document.getElementById('kmb-selected-count').innerText = 0;
        return;
    }
    kmbSelected.forEach((item, index) => {
        const isGmb = item.company === 'gmb';
        const badgeBorder = isGmb ? 'border-green-200 dark:border-[#34c759]/40' : 'border-red-200 dark:border-red-500/30';
        const routeColor = isGmb ? 'text-[#34c759]' : 'text-[#ff453a]';

        list.innerHTML += `
            <div class="flex items-center gap-1.5 bg-white dark:bg-[#1c2a3d] border ${badgeBorder} px-2 py-1 rounded-lg shadow-sm">
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-800 dark:text-gray-100"><span class="${routeColor} mr-1">${item.route}</span>${item.stopName}</span>
                    <span class="text-[9px] text-gray-500">往 ${item.dest}</span>
                </div>
                <div class="flex flex-col gap-0.5 ml-1">
                    <button onclick="moveKmbSort(${index}, -1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}">▲</button>
                    <button onclick="moveKmbSort(${index}, 1)" class="sort-btn text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${index === kmbSelected.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}">▼</button>
                </div>
            </div>
        `;
    });
    document.getElementById('kmb-selected-count').innerText = kmbSelected.length;
}

function moveKmbSort(index, direction) {
    if (index + direction < 0 || index + direction >= kmbSelected.length) return;
    const temp = kmbSelected[index];
    kmbSelected[index] = kmbSelected[index + direction];
    kmbSelected[index + direction] = temp;
    renderKmbSortList();
}