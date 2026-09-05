// 1. Initialize Mock Database (Browser LocalStorage)
function initDatabase() {
    if (!localStorage.getItem('reports')) {
        const wasteTypes = ['Plastic', 'Organic', 'Construction', 'Mixed', 'E-waste'];
        const severities = ['Low', 'Medium', 'High', 'Critical'];
        const statuses = ['Reported', 'AI Analyzed', 'Team Assigned', 'Resolved'];
        let reports = [];
        let base_lat = 26.8467, base_lng = 80.9462; // Demo Coordinates (Lucknow)

        for (let i = 0; i < 25; i++) {
            let severity = severities[Math.floor(Math.random() * severities.length)];
            let priority = (severity === 'High' || severity === 'Critical') ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 40) + 20;
            reports.push({
                id: i + 1,
                waste_type: wasteTypes[Math.floor(Math.random() * wasteTypes.length)],
                confidence: Math.floor(Math.random() * 10) + 90,
                severity: severity,
                priority_score: priority,
                lat: base_lat + (Math.random() - 0.5) * 0.1,
                lng: base_lng + (Math.random() - 0.5) * 0.1,
                ward: "Ward " + (Math.floor(Math.random() * 20) + 1),
                status: statuses[Math.floor(Math.random() * statuses.length)],
            });
        }
        localStorage.setItem('reports', JSON.stringify(reports));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Run Database Init & Load Icons
    initDatabase();
    if(window.lucide) {
        lucide.createIcons();
    }

    // --------------------------------------------------------
    // 2. CITIZEN APP: MOCK AI - Image Upload Flow (report.html)
    // --------------------------------------------------------
    const fileUpload = document.getElementById('wasteImage');
    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                // Hide Upload UI, Show AI Scanning Animation
                document.getElementById('uploadUI').classList.add('hidden');
                document.getElementById('aiScanningUI').classList.remove('hidden');
                
                // Simulate AI Processing Latency (2.5 Seconds)
                setTimeout(() => {
                    const mockAiData = {
                        type: 'Plastic & Mixed Waste',
                        confidence: 94,
                        severity: 'HIGH',
                        priority_score: 87
                    };
                    
                    document.getElementById('aiScanningUI').classList.add('hidden');
                    document.getElementById('aiResultUI').classList.remove('hidden');
                    
                    // Populate AI Results in UI
                    document.getElementById('resType').innerText = mockAiData.type;
                    document.getElementById('resConf').innerText = mockAiData.confidence + '%';
                    document.getElementById('resConfBar').style.width = mockAiData.confidence + '%';
                    document.getElementById('resSev').innerText = mockAiData.severity;
                    document.getElementById('resPriority').innerText = mockAiData.priority_score + '/100';
                    
                    // Save for submission
                    window.currentAiData = mockAiData;
                }, 2500);
            }
        });
    }

    // Submit Report (Saves to LocalStorage)
    const submitBtn = document.getElementById('submitReport');
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
            let reports = JSON.parse(localStorage.getItem('reports'));
            reports.push({
                id: reports.length + 1,
                waste_type: window.currentAiData.type,
                confidence: window.currentAiData.confidence,
                severity: window.currentAiData.severity,
                priority_score: window.currentAiData.priority_score,
                lat: 26.8467 + (Math.random() - 0.5) * 0.1,
                lng: 80.9462 + (Math.random() - 0.5) * 0.1,
                ward: "Ward 12 (New Hotspot)",
                status: "Reported"
            });
            localStorage.setItem('reports', JSON.stringify(reports));
            
            // Hackathon Demo Alert
            alert("✅ Report submitted successfully! AI has notified the Municipal team.");
            window.location.href = 'citizen.html'; // Redirect back to dashboard
        });
    }

    // --------------------------------------------------------
    // 3. ADMIN DASHBOARD: Init Charts & Maps (admin.html)
    // --------------------------------------------------------
    if (document.getElementById('wasteChart')) {
        initAdminDashboard();
    }
});

function initAdminDashboard() {
    let reports = JSON.parse(localStorage.getItem('reports'));
    reports.sort((a, b) => b.priority_score - a.priority_score); // Sort by highest priority

    // A. Populate Top KPI Cards
    if(document.getElementById('totalReports')) {
        document.getElementById('totalReports').innerText = reports.length;
        document.getElementById('highPriority').innerText = reports.filter(r => r.priority_score > 80).length;
    }

    // B. Populate Smart Priority Table
    const tableBody = document.getElementById('adminTableBody');
    if(tableBody) {
        tableBody.innerHTML = '';
        reports.slice(0, 5).forEach(report => {
            let sevColor = report.severity === 'Critical' ? 'text-red-400' : report.severity === 'High' ? 'text-orange-400' : 'text-emerald-400';
            tableBody.innerHTML += `
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 text-white font-medium">${report.ward}</td>
                    <td class="p-4 text-slate-300"><span class="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">${report.waste_type}</span></td>
                    <td class="p-4"><span class="${sevColor} text-sm font-bold">${report.severity}</span></td>
                    <td class="p-4">
                        <div class="flex items-center gap-2 text-sm">
                            <span class="${report.priority_score > 80 ? 'text-red-400 font-bold' : 'text-slate-300'}">${report.priority_score}</span>
                            <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full ${report.priority_score > 80 ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${report.priority_score}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4"><span class="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-full">${report.status}</span></td>
                </tr>
            `;
        });
    }

    // C. Initialize Leaflet Map
    if(typeof L !== 'undefined' && document.getElementById('adminMap')) {
        const map = L.map('adminMap').setView([26.8467, 80.9462], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

        reports.forEach(report => {
            let color = report.severity === 'Critical' ? '#ef4444' : report.severity === 'High' ? '#f97316' : '#10b981';
            L.circleMarker([report.lat, report.lng], {
                radius: report.severity === 'Critical' ? 12 : 8,
                fillColor: color, color: color, weight: 1, opacity: 1, fillOpacity: 0.6
            }).addTo(map).bindPopup(`<strong class="text-slate-900">${report.ward}</strong><br><span class="text-xs text-slate-600">${report.waste_type}</span><br><b style="color:${color}">Score: ${report.priority_score}</b>`);
        });

        // Add Mock AI Prediction Zone (Purple Circle)
        L.circle([26.85, 80.95], { color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.3, radius: 800 })
        .addTo(map).bindPopup("<b>AI Prediction Zone</b><br>High probability of becoming a critical hotspot in 24hrs.");
    }

    // D. Initialize Chart.js Graphs
    if(typeof Chart !== 'undefined') {
        // Line Chart
        if(document.getElementById('wasteChart')) {
            new Chart(document.getElementById('wasteChart').getContext('2d'), {
                type: 'line',
                data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [12, 19, 15, 25, 22, 30, 28], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // Doughnut Chart
        if(document.getElementById('distChart')) {
            new Chart(document.getElementById('distChart').getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['Plastic', 'Organic', 'Construction', 'Mixed', 'E-Waste'], datasets: [{ data: [35, 25, 15, 20, 5], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
            });
        }
    }
}
