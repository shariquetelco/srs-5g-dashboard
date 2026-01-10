#!/usr/bin/env python3
"""
Metrics History Storage
Stores time-series data for charts by Ahmad Sharique
"""

from datetime import datetime
from collections import deque
import json

class MetricsHistory:
    def __init__(self, max_points=50):
        self.max_points = max_points
        self.timestamps = deque(maxlen=max_points)
        self.ue_count = deque(maxlen=max_points)
        self.errors = deque(maxlen=max_points)
        self.warnings = deque(maxlen=max_points)
        self.gnb_status = deque(maxlen=max_points)
        self.ngap_status = deque(maxlen=max_points)
        self.core_running = deque(maxlen=max_points)
    
    def add_datapoint(self, metrics, open5gs_status):
        """Add new metrics datapoint"""
        now = datetime.now()
        
        self.timestamps.append(now.strftime('%H:%M:%S'))
        self.ue_count.append(metrics.get('ue_connections', 0))
        self.errors.append(len(metrics.get('errors', [])))
        self.warnings.append(len(metrics.get('warnings', [])))
        
        # Status as 1 (active) or 0 (inactive)
        self.gnb_status.append(1 if metrics.get('status') == 'running' else 0)
        self.ngap_status.append(1 if metrics.get('ngap_status') == 'connected' else 0)
        self.core_running.append(open5gs_status.get('running_count', 0))
    
    def get_chart_data(self):
        """Return data formatted for Chart.js"""
        return {
            'labels': list(self.timestamps),
            'ue_count': list(self.ue_count),
            'errors': list(self.errors),
            'warnings': list(self.warnings),
            'gnb_status': list(self.gnb_status),
            'ngap_status': list(self.ngap_status),
            'core_running': list(self.core_running)
        }

# Global instance
history = MetricsHistory(max_points=50)
