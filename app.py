#!/usr/bin/env python3
"""
srsRAN 5G Dashboard - Flask Backend
Real-time monitoring dashboard for srsRAN Project gNB by Ahmad Sharique
"""

from flask import Flask, render_template, jsonify
from flask_cors import CORS
import os
import sys
import time
from threading import Thread, Lock
from datetime import datetime

from parsers.pcap_parser import pcap_parser
from parsers.open5gs_checker import Open5GSChecker
from parsers.metrics_history import history
from parsers.call_flow_parser import call_flow_parser

# Add parsers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'parsers'))
from gnb_parser import GnbLogParser

app = Flask(__name__)
CORS(app)

# Configuration
LOG_FILE = '/tmp/gnb.log'
UPDATE_INTERVAL = 2  # seconds

# Global state
parser = GnbLogParser()
open5gs_checker = Open5GSChecker()
metrics_lock = Lock()
latest_events = []
monitoring_active = False


def monitor_logs():
    """Background thread to continuously monitor gNB logs"""
    global latest_events, monitoring_active

    monitoring_active = True
    last_size = 0

    while monitoring_active:
        try:
            if os.path.exists(LOG_FILE):
                current_size = os.path.getsize(LOG_FILE)

                if current_size > last_size or current_size == 0:
                    with metrics_lock:
                        events = parser.parse_file(LOG_FILE, tail_lines=100)
                        latest_events = events[-50:]

                        # ---- ADDED: history update ----
                        open5gs_status = open5gs_checker.get_all_status()
                        history.add_datapoint(
                            parser.get_metrics(),
                            open5gs_status
                        )
                        # --------------------------------

                    last_size = current_size
            else:
                with metrics_lock:
                    parser.metrics['status'] = 'waiting_for_gnb'

            time.sleep(UPDATE_INTERVAL)

        except Exception as e:
            print(f"Monitor error: {e}")
            time.sleep(UPDATE_INTERVAL)


@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('dashboard.html')


@app.route('/api/metrics')
def get_metrics():
    """API endpoint for current metrics"""
    with metrics_lock:
        metrics = parser.get_metrics()
        metrics['timestamp'] = datetime.now().isoformat()
    return jsonify(metrics)


@app.route('/api/events')
def get_events():
    """API endpoint for recent events"""
    with metrics_lock:
        events = latest_events.copy()
    return jsonify({
        'events': events,
        'count': len(events),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/summary')
def get_summary():
    """API endpoint for text summary"""
    with metrics_lock:
        summary = parser.get_summary()
    return jsonify({
        'summary': summary,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'monitoring': monitoring_active,
        'log_file': LOG_FILE,
        'log_exists': os.path.exists(LOG_FILE),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/config')
def get_config():
    """Get dashboard configuration"""
    return jsonify({
        'log_file': LOG_FILE,
        'update_interval': UPDATE_INTERVAL,
        'parser_version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/open5gs')
def get_open5gs_status():
    """API endpoint for Open5GS core status"""
    status = open5gs_checker.get_all_status()
    return jsonify({
        'status': status,
        'timestamp': datetime.now().isoformat()
    })


# ---- NEW API ENDPOINT ----
@app.route('/api/charts')
def get_chart_data():
    """API endpoint for chart data"""
    return jsonify({
        'data': history.get_chart_data(),
        'timestamp': datetime.now().isoformat()
    })
# --------------------------
@app.route('/api/rf-metrics')
def get_rf_metrics():
    rf_data = pcap_parser.parse_pcap()
    return jsonify({'data': rf_data, 'timestamp': datetime.now().isoformat()})

@app.route('/api/call-flow')
def get_call_flow():
    messages = call_flow_parser.parse_logs()
    return jsonify({'messages': messages, 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("=" * 60)
    print("srsRAN 5G Dashboard Starting...")
    print("=" * 60)
    print(f"Monitoring log file: {LOG_FILE}")
    print(f"Update interval: {UPDATE_INTERVAL} seconds")
    print("Dashboard available at: http://localhost:5000")
    print("=" * 60)

    monitor_thread = Thread(target=monitor_logs, daemon=True)
    monitor_thread.start()

    try:
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\nShutting down dashboard...")
        monitoring_active = False
