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

        // ================= 初始化 =================
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
        const DASHBOARD_VERSION = "1.0"; // 設定當前版本

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