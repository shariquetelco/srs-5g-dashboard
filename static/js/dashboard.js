// srsRAN 5G Dashboard - Frontend JavaScript
// Real-time monitoring and updates

const API_BASE = '';
const UPDATE_INTERVAL = 2000; // 2 seconds

let ueChart = null;
let alertsChart = null;
let updateTimer = null;
let isConnected = false;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initializing...');
    initCharts();
    startMonitoring();
});

// Start real-time monitoring
function startMonitoring() {
    updateDashboard();
    updateTimer = setInterval(updateDashboard, UPDATE_INTERVAL);
}

// Fetch metrics from API
async function fetchMetrics() {
    const response = await fetch(`${API_BASE}/api/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return await response.json();
}

// Fetch events from API
async function fetchEvents() {
    const response = await fetch(`${API_BASE}/api/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return await response.json();
}

// Fetch summary from API
async function fetchSummary() {
    const response = await fetch(`${API_BASE}/api/summary`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    return await response.json();
}
// Fetch Open5GS status from API
async function fetchOpen5GSStatus() {
    const response = await fetch(`${API_BASE}/api/open5gs`);
    if (!response.ok) throw new Error('Failed to fetch Open5GS status');
    return await response.json();
}

// Fetch chart data
async function fetchChartData() {
    const response = await fetch(`${API_BASE}/api/charts`);
    if (!response.ok) throw new Error('Failed to fetch chart data');
    return await response.json();
}

// Initialize charts
function initCharts() {
    const ueCtx = document.getElementById('ueChart').getContext('2d');
    const alertsCtx = document.getElementById('alertsChart').getContext('2d');
    
    ueChart = new Chart(ueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Connected UEs',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { title: { display: true, text: 'UE Connections Over Time' }}
        }
    });
    
    alertsChart = new Chart(alertsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Errors',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                },
                {
                    label: 'Warnings',
                    data: [],
                    borderColor: 'rgb(255, 205, 86)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { title: { display: true, text: 'Alerts Over Time' }}
        }
    });
}

// Update charts
function updateCharts(chartData) {
    if (!ueChart || !alertsChart) return;
    
    const data = chartData.data;
    
    ueChart.data.labels = data.labels;
    ueChart.data.datasets[0].data = data.ue_count;
    ueChart.update();
    
    alertsChart.data.labels = data.labels;
    alertsChart.data.datasets[0].data = data.errors;
    alertsChart.data.datasets[1].data = data.warnings;
    alertsChart.update();
}

// Update metrics display
// Main update function
async function updateDashboard() {
    try {
        // Fetch metrics
        const metrics = await fetchMetrics();
        updateMetricsDisplay(metrics);
        
        // Fetch events
        const events = await fetchEvents();
        updateEventsDisplay(events);
        
        // Fetch summary
        const summary = await fetchSummary();
        updateSummaryDisplay(summary);
        
        // Fetch chart data
        const charts = await fetchChartData();
        updateCharts(charts);
 
        // Fetch Open5GS status
        const open5gs = await fetchOpen5GSStatus();
        updateOpen5GSDisplay(open5gs);
        
        // Update connection status
        updateConnectionStatus(true);
        
    } catch (error) {
        console.error('Update error:', error);
        updateConnectionStatus(false);
    }
}
function updateMetricsDisplay(metrics) {
    // System Status
    updateElement('gnb-status', formatStatus(metrics.status));
    updateElement('ngap-status', formatStatus(metrics.ngap_status));
    updateElement('zmq-status', formatStatus(metrics.zmq_status));
    updateElement('ue-count', metrics.ue_connections || 0);
    
    // Apply status colors
    applyStatusColor('gnb-status', metrics.status);
    applyStatusColor('ngap-status', metrics.ngap_status);
    applyStatusColor('zmq-status', metrics.zmq_status);
    
    // Cell Configuration
    if (metrics.cell_info && Object.keys(metrics.cell_info).length > 0) {
        const cell = metrics.cell_info;
        updateElement('cell-pci', cell.pci || '--');
        updateElement('cell-bw', cell.bandwidth_mhz ? `${cell.bandwidth_mhz} MHz` : '--');
        updateElement('cell-band', cell.band ? `n${cell.band}` : '--');
        updateElement('cell-freq', cell.dl_freq_mhz ? `${cell.dl_freq_mhz} MHz` : '--');
        updateElement('cell-arfcn', cell.dl_arfcn || '--');
        updateElement('cell-antennas', 
            cell.tx_antennas && cell.rx_antennas ? 
            `${cell.tx_antennas}T${cell.rx_antennas}R` : '--');
    }
    
    // Alerts
    updateAlerts(metrics.errors, 'error');
    updateAlerts(metrics.warnings, 'warning');
}

// Update events display
function updateEventsDisplay(data) {
    const eventsList = document.getElementById('events-list');
    
    if (!data.events || data.events.length === 0) {
        eventsList.innerHTML = '<p class="no-events">No events yet</p>';
        return;
    }
    
    // Show last 10 events
    const recentEvents = data.events.slice(-10).reverse();
    
    eventsList.innerHTML = recentEvents.map(event => `
        <div class="event-item">
            <div class="event-type">${formatEventType(event.type)}</div>
            <div class="event-data">${formatEventData(event)}</div>
            ${event.timestamp ? `<div class="event-timestamp">${formatTimestamp(event.timestamp)}</div>` : ''}
        </div>
    `).join('');
}

// Update summary display
function updateSummaryDisplay(data) {
    updateElement('summary-text', data.summary || 'No summary available');
}

// Update alerts (errors/warnings)
function updateAlerts(alerts, type) {
    const listId = `${type}-list`;
    const countId = `${type}-count`;
    const list = document.getElementById(listId);
    const count = document.getElementById(countId);
    
    if (!alerts || alerts.length === 0) {
        list.innerHTML = `<p class="no-alerts">No ${type}s</p>`;
        count.textContent = '0';
        return;
    }
    
    count.textContent = alerts.length;
    
    // Show last 5 alerts
    const recentAlerts = alerts.slice(-5).reverse();
    
    list.innerHTML = recentAlerts.map(alert => `
        <div class="alert-item ${type}">
            ${escapeHtml(alert.message)}
            ${alert.timestamp ? `<span class="alert-timestamp">${formatTimestamp(alert.timestamp)}</span>` : ''}
        </div>
    `).join('');
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    const updateEl = document.getElementById('last-update');
    
    if (connected) {
        statusEl.textContent = 'Connected';
        statusEl.className = 'status-badge connected';
        updateEl.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        isConnected = true;
    } else {
        statusEl.textContent = 'Disconnected';
        statusEl.className = 'status-badge disconnected';
        isConnected = false;
    }
}

// Helper: Update element text content
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Helper: Apply status color
function applyStatusColor(elementId, status) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('success', 'warning', 'danger');
    
    const statusLower = String(status).toLowerCase();
    
    if (['running', 'connected', 'active', 'ok'].includes(statusLower)) {
        element.classList.add('success');
    } else if (['waiting', 'pending', 'unknown'].includes(statusLower)) {
        element.classList.add('warning');
    } else if (['failed', 'disconnected', 'error', 'stopped'].includes(statusLower)) {
        element.classList.add('danger');
    }
}

// Helper: Format status text
function formatStatus(status) {
    if (!status) return 'Unknown';
    return String(status)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Helper: Format event type
function formatEventType(type) {
    if (!type) return 'Event';
    return String(type)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Helper: Format event data
function formatEventData(event) {
    if (!event.data) return '';
    
    if (typeof event.data === 'string') {
        return escapeHtml(event.data);
    }
    
    if (typeof event.data === 'object') {
        return Object.entries(event.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    }
    
    return String(event.data);
}

// Helper: Format timestamp
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return timestamp;
    }
}

// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Update Open5GS core status display
function updateOpen5GSDisplay(data) {
    if (!data.status) return;
    
    const status = data.status;
    
    // Overall status
    updateElement('core-overall', formatStatus(status.overall));
    applyStatusColor('core-overall', status.overall);
    
    // Individual services
    updateElement('core-amf', formatStatus(status.amf));
    applyStatusColor('core-amf', status.amf);
    
    updateElement('core-smf', formatStatus(status.smf));
    applyStatusColor('core-smf', status.smf);
    
    updateElement('core-upf', formatStatus(status.upf));
    applyStatusColor('core-upf', status.upf);
    
    updateElement('core-nrf', formatStatus(status.nrf));
    applyStatusColor('core-nrf', status.nrf);
    
    // Running count
    updateElement('core-count', `${status.running_count}/${status.total_count}`);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
});

console.log('Dashboard JavaScript loaded');
