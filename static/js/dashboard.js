// srsRAN 5G Dashboard - Frontend JavaScript
// Real-time monitoring and updates

const API_BASE = '';
const UPDATE_INTERVAL = 2000; // 2 seconds

let updateTimer = null;
let isConnected = false;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initializing...');
    startMonitoring();
});

// Start real-time monitoring
function startMonitoring() {
    updateDashboard();
    updateTimer = setInterval(updateDashboard, UPDATE_INTERVAL);
}

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
        
        // Update connection status
        updateConnectionStatus(true);
        
    } catch (error) {
        console.error('Update error:', error);
        updateConnectionStatus(false);
    }
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

// Update metrics display
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
});

console.log('Dashboard JavaScript loaded');
