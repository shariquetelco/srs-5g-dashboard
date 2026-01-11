// Name : Ahmad Sharique
// email : ahmad@iabg.de
// srsRAN 5G Dashboard - Frontend JavaScript
// Real-time monitoring and updates

// Name : Ahmad Sharique
// email : ahmad@iabg.de
// srsRAN 5G Dashboard - Frontend JavaScript
// Real-time monitoring and updates

const API_BASE = '';
const UPDATE_INTERVAL = 2000; // 2 seconds

let signalChart = null;
let freqChart = null;
let ueChart = null;
let alertsChart = null;
let updateTimer = null;
let isConnected = false;

// -------------------- INIT --------------------

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initializing...');

    // Mermaid init (UPDATED)
    mermaid.initialize({ startOnLoad: true, theme: 'default' });

    initCharts();
    startMonitoring();
});

// -------------------- MONITOR --------------------

function startMonitoring() {
    updateDashboard();
    updateTimer = setInterval(updateDashboard, UPDATE_INTERVAL);
}

// -------------------- API FETCHERS --------------------

async function fetchMetrics() {
    const response = await fetch(`${API_BASE}/api/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return await response.json();
}

async function fetchEvents() {
    const response = await fetch(`${API_BASE}/api/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return await response.json();
}

async function fetchSummary() {
    const response = await fetch(`${API_BASE}/api/summary`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    return await response.json();
}

async function fetchOpen5GSStatus() {
    const response = await fetch(`${API_BASE}/api/open5gs`);
    if (!response.ok) throw new Error('Failed to fetch Open5GS status');
    return await response.json();
}

async function fetchChartData() {
    const response = await fetch(`${API_BASE}/api/charts`);
    if (!response.ok) throw new Error('Failed to fetch chart data');
    return await response.json();
}

// RF metrics
async function fetchRFMetrics() {
    const response = await fetch(`${API_BASE}/api/rf-metrics`);
    if (!response.ok) throw new Error('Failed to fetch RF');
    return await response.json();
}

// -------------------- CALL FLOW --------------------

async function fetchCallFlow() {
    const response = await fetch(`${API_BASE}/api/call-flow`);
    if (!response.ok) throw new Error('Failed to fetch call flow');
    return await response.json();
}

// UPDATED FUNCTION
function updateCallFlow(data) {
    if (!data.messages || data.messages.length === 0) return;
    
    let diagram = 'sequenceDiagram\n    participant gNB\n    participant AMF\n    participant UPF\n';
    
    data.messages.slice(-10).forEach(msg => {
        diagram += `    ${msg.from}->>${msg.to}: ${msg.message}\n`;
    });
    
    const container = document.getElementById('call-flow-diagram');
    if (!container) return;

    container.innerHTML = diagram;
    container.removeAttribute('data-processed');
    mermaid.init(undefined, container);
}

// -------------------- CHART INIT --------------------

function initCharts() {
    const ueCtx = document.getElementById('ueChart').getContext('2d');
    const alertsCtx = document.getElementById('alertsChart').getContext('2d');

    ueChart = new Chart(ueCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Connected UEs', data: [], borderColor: 'rgb(75,192,192)', tension: 0.1 }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'UE Connections Over Time' } } }
    });

    alertsChart = new Chart(alertsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Errors', data: [], borderColor: 'rgb(255,99,132)', tension: 0.1 },
                { label: 'Warnings', data: [], borderColor: 'rgb(255,205,86)', tension: 0.1 }
            ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Alerts Over Time' } } }
    });

    const signalCtx = document.getElementById('signalPowerChart').getContext('2d');
    const freqCtx = document.getElementById('frequencyChart').getContext('2d');
    const channelCtx = document.getElementById('channelResponseChart').getContext('2d');
    const constCtx = document.getElementById('constellationChart').getContext('2d');

    signalChart = new Chart(signalCtx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 50 }, (_, i) => i),
            datasets: [{
                label: 'RSRP (dBm)',
                data: [],
                borderColor: 'rgb(54,162,235)',
                backgroundColor: 'rgba(54,162,235,0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Signal Power (RSRP)' }},
            scales: { y: { min: -100, max: -50 } }
        }
    });

    freqChart = new Chart(freqCtx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 50 }, (_, i) => i),
            datasets: [{
                label: 'Frequency (MHz)',
                data: [],
                borderColor: 'rgb(153,102,255)',
                backgroundColor: 'rgba(153,102,255,0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Channel Frequency' }},
            scales: { y: { min: 1841, max: 1844 } }
        }
    });

    signalChart.channelChart = new Chart(channelCtx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 52 }, (_, i) => i),
            datasets: [{
                label: 'Channel Response',
                data: [],
                backgroundColor: 'rgba(75,192,192,0.6)',
                borderColor: 'rgb(75,192,192)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Frequency Response (52 RBs)' }},
            scales: { y: { min: 0, max: 1.5 } }
        }
    });

    freqChart.constChart = new Chart(constCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'IQ Constellation',
                data: [],
                backgroundColor: 'rgba(255,99,132,0.5)',
                borderColor: 'rgb(255,99,132)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'IQ Constellation (QPSK)' }},
            scales: {
                x: { min: -1.5, max: 1.5, title: { display: true, text: 'I' }},
                y: { min: -1.5, max: 1.5, title: { display: true, text: 'Q' }}
            }
        }
    });
}

// -------------------- UPDATE --------------------

function updateCharts(chartData) {
    if (!ueChart || !alertsChart) return;
    const d = chartData.data;

    ueChart.data.labels = d.labels;
    ueChart.data.datasets[0].data = d.ue_count;
    ueChart.update();

    alertsChart.data.labels = d.labels;
    alertsChart.data.datasets[0].data = d.errors;
    alertsChart.data.datasets[1].data = d.warnings;
    alertsChart.update();
}

async function updateDashboard() {
    try {
        const metrics = await fetchMetrics();
        updateMetricsDisplay(metrics);

        const events = await fetchEvents();
        updateEventsDisplay(events);

        const summary = await fetchSummary();
        updateSummaryDisplay(summary);

        const charts = await fetchChartData();
        updateCharts(charts);

        // -------- RF METRICS --------
        const rfData = await fetchRFMetrics();

        if (signalChart && freqChart) {
            signalChart.data.datasets[0].data = rfData.data.signal_power;
            signalChart.update();

            freqChart.data.datasets[0].data = rfData.data.frequency;
            freqChart.update();

            signalChart.channelChart.data.datasets[0].data =
                rfData.data.channel_response;
            signalChart.channelChart.update();

            const iqData = rfData.data.iq_i.map((i, idx) => ({
                x: i,
                y: rfData.data.iq_q[idx]
            }));

            freqChart.constChart.data.datasets[0].data = iqData;
            freqChart.constChart.update();
        }

        // -------- CALL FLOW --------
        const callFlow = await fetchCallFlow();
        updateCallFlow(callFlow);

        const open5gs = await fetchOpen5GSStatus();
        updateOpen5GSDisplay(open5gs);

        updateConnectionStatus(true);

    } catch (error) {
        console.error('Update error:', error);
        updateConnectionStatus(false);
    }
}

// -------------------- UI HELPERS --------------------

function updateMetricsDisplay(metrics) {
    updateElement('gnb-status', formatStatus(metrics.status));
    updateElement('ngap-status', formatStatus(metrics.ngap_status));
    updateElement('zmq-status', formatStatus(metrics.zmq_status));
    updateElement('ue-count', metrics.ue_connections || 0);

    applyStatusColor('gnb-status', metrics.status);
    applyStatusColor('ngap-status', metrics.ngap_status);
    applyStatusColor('zmq-status', metrics.zmq_status);

    if (metrics.cell_info) {
        const c = metrics.cell_info;
        updateElement('cell-pci', c.pci || '--');
        updateElement('cell-bw', c.bandwidth_mhz ? `${c.bandwidth_mhz} MHz` : '--');
        updateElement('cell-band', c.band ? `n${c.band}` : '--');
        updateElement('cell-freq', c.dl_freq_mhz ? `${c.dl_freq_mhz} MHz` : '--');
        updateElement('cell-arfcn', c.dl_arfcn || '--');
        updateElement('cell-antennas',
            c.tx_antennas && c.rx_antennas ? `${c.tx_antennas}T${c.rx_antennas}R` : '--'
        );
    }

    updateAlerts(metrics.errors, 'error');
    updateAlerts(metrics.warnings, 'warning');
}

function updateEventsDisplay(data) {
    const el = document.getElementById('events-list');

    if (!data.events || !data.events.length) {
        el.innerHTML = '<p class="no-events">No events yet</p>';
        return;
    }

    el.innerHTML = data.events.slice(-10).reverse().map(e => `
        <div class="event-item">
            <div class="event-type">${formatEventType(e.type)}</div>
            <div class="event-data">${formatEventData(e)}</div>
            ${e.timestamp ? `<div class="event-timestamp">${formatTimestamp(e.timestamp)}</div>` : ''}
        </div>
    `).join('');
}

function updateSummaryDisplay(d) {
    updateElement('summary-text', d.summary || 'No summary available');
}

function updateAlerts(alerts, type) {
    const list = document.getElementById(`${type}-list`);
    const count = document.getElementById(`${type}-count`);

    if (!alerts || !alerts.length) {
        list.innerHTML = `<p class="no-alerts">No ${type}s</p>`;
        count.textContent = '0';
        return;
    }

    count.textContent = alerts.length;

    list.innerHTML = alerts.slice(-5).reverse().map(a => `
        <div class="alert-item ${type}">
            ${escapeHtml(a.message)}
            ${a.timestamp ? `<span class="alert-timestamp">${formatTimestamp(a.timestamp)}</span>` : ''}
        </div>
    `).join('');
}

// -------------------- STATUS --------------------

function updateConnectionStatus(connected) {
    const s = document.getElementById('connection-status');
    const u = document.getElementById('last-update');

    if (connected) {
        s.textContent = 'Connected';
        s.className = 'status-badge connected';
        u.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        isConnected = true;
    } else {
        s.textContent = 'Disconnected';
        s.className = 'status-badge disconnected';
        isConnected = false;
    }
}

// -------------------- UTILITIES --------------------

function updateElement(id, val) {
    const e = document.getElementById(id);
    if (e) e.textContent = val;
}

function applyStatusColor(id, status) {
    const e = document.getElementById(id);
    if (!e) return;

    e.classList.remove('success', 'warning', 'danger');
    const s = String(status).toLowerCase();

    if (['running','connected','active','ok'].includes(s)) e.classList.add('success');
    else if (['waiting','pending','unknown'].includes(s)) e.classList.add('warning');
    else e.classList.add('danger');
}

function formatStatus(s) {
    if (!s) return 'Unknown';
    return String(s).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatEventType(t) {
    if (!t) return 'Event';
    return String(t).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatEventData(e) {
    if (!e.data) return '';
    if (typeof e.data === 'string') return escapeHtml(e.data);
    if (typeof e.data === 'object')
        return Object.entries(e.data).map(([k,v]) => `${k}: ${v}`).join(', ');
    return String(e.data);
}

function formatTimestamp(ts) {
    try { return new Date(ts).toLocaleString(); }
    catch { return ts; }
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

// -------------------- OPEN5GS --------------------

function updateOpen5GSDisplay(d) {
    if (!d.status) return;
    const s = d.status;

    updateElement('core-overall', formatStatus(s.overall));
    applyStatusColor('core-overall', s.overall);

    updateElement('core-amf', formatStatus(s.amf));
    applyStatusColor('core-amf', s.amf);

    updateElement('core-smf', formatStatus(s.smf));
    applyStatusColor('core-smf', s.smf);

    updateElement('core-upf', formatStatus(s.upf));
    applyStatusColor('core-upf', s.upf);

    updateElement('core-nrf', formatStatus(s.nrf));
    applyStatusColor('core-nrf', s.nrf);

    updateElement('core-count', `${s.running_count}/${s.total_count}`);
}

// -------------------- CLEANUP --------------------

window.addEventListener('beforeunload', () => {
    if (updateTimer) clearInterval(updateTimer);
});

console.log('Dashboard JavaScript loaded');
