#!/usr/bin/env python3
"""
srsRAN gNB Log Parser
Parses gNB logs and extracts key metrics and events
"""

import re
from datetime import datetime
from typing import Dict, List, Optional
import json

class GnbLogParser:
    """Parser for srsRAN Project gNB logs"""
    
    def __init__(self):
        self.metrics = {
            'status': 'unknown',
            'cell_info': {},
            'ngap_status': 'disconnected',
            'ue_connections': 0,
            'errors': [],
            'warnings': [],
            'zmq_status': 'unknown',
            'last_update': None
        }
        
        # Regex patterns for log parsing
        self.patterns = {
            'cell_start': re.compile(r'Cell pci=(\d+), bw=(\d+) MHz, (\d+)T(\d+)R, dl_arfcn=(\d+) \(n(\d+)\), dl_freq=([\d.]+) MHz'),
            'ngap_connected': re.compile(r'N2: Connection to AMF on ([\d.]+):(\d+) completed'),
            'ngap_failed': re.compile(r'CU-CP failed to connect to AMF'),
            'ue_attach': re.compile(r'UE.*attached'),
            'zmq_status': re.compile(r'\[zmq:(rx|tx):\d+:\d+\].*Waiting for (data|reading samples)'),
            'error': re.compile(r'ERROR|Error|error'),
            'warning': re.compile(r'WARNING|Warning|warn'),
            'timestamp': re.compile(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+)')
        }
    
    def parse_line(self, line: str) -> Optional[Dict]:
        """Parse a single log line and extract information"""
        event = {}
        
        # Extract timestamp
        ts_match = self.patterns['timestamp'].search(line)
        if ts_match:
            event['timestamp'] = ts_match.group(1)
        
        # Check for cell startup
        cell_match = self.patterns['cell_start'].search(line)
        if cell_match:
            self.metrics['cell_info'] = {
                'pci': cell_match.group(1),
                'bandwidth_mhz': cell_match.group(2),
                'tx_antennas': cell_match.group(3),
                'rx_antennas': cell_match.group(4),
                'dl_arfcn': cell_match.group(5),
                'band': cell_match.group(6),
                'dl_freq_mhz': cell_match.group(7)
            }
            self.metrics['status'] = 'running'
            event['type'] = 'cell_start'
            event['data'] = self.metrics['cell_info']
            return event
        
        # Check NGAP status
        if self.patterns['ngap_connected'].search(line):
            self.metrics['ngap_status'] = 'connected'
            ngap_match = self.patterns['ngap_connected'].search(line)
            event['type'] = 'ngap_connected'
            event['data'] = {
                'amf_ip': ngap_match.group(1),
                'amf_port': ngap_match.group(2)
            }
            return event
        
        if self.patterns['ngap_failed'].search(line):
            self.metrics['ngap_status'] = 'failed'
            event['type'] = 'ngap_failed'
            return event
        
        # Check ZMQ status
        if self.patterns['zmq_status'].search(line):
            self.metrics['zmq_status'] = 'active'
            event['type'] = 'zmq_activity'
        
        # Check for UE attachments
        if self.patterns['ue_attach'].search(line):
            self.metrics['ue_connections'] += 1
            event['type'] = 'ue_attached'
            event['data'] = {'total_ues': self.metrics['ue_connections']}
            return event
        
        # Check for errors
        if self.patterns['error'].search(line):
            error_msg = line.strip()
            self.metrics['errors'].append({
                'timestamp': event.get('timestamp', 'unknown'),
                'message': error_msg
            })
            # Keep only last 100 errors
            if len(self.metrics['errors']) > 100:
                self.metrics['errors'] = self.metrics['errors'][-100:]
            event['type'] = 'error'
            event['data'] = {'message': error_msg}
            return event
        
        # Check for warnings
        if self.patterns['warning'].search(line):
            warning_msg = line.strip()
            self.metrics['warnings'].append({
                'timestamp': event.get('timestamp', 'unknown'),
                'message': warning_msg
            })
            # Keep only last 100 warnings
            if len(self.metrics['warnings']) > 100:
                self.metrics['warnings'] = self.metrics['warnings'][-100:]
            event['type'] = 'warning'
            event['data'] = {'message': warning_msg}
            return event
        
        return None
    
    def parse_file(self, filepath: str, tail_lines: int = 1000) -> List[Dict]:
        """Parse log file and return events"""
        events = []
        try:
            with open(filepath, 'r') as f:
                # Read last N lines for efficiency
                lines = f.readlines()[-10000:]
                for line in lines:
                    event = self.parse_line(line)
                    if event:
                        events.append(event)
            
            self.metrics['last_update'] = datetime.now().isoformat()
        except FileNotFoundError:
            self.metrics['status'] = 'log_not_found'
        except Exception as e:
            self.metrics['status'] = 'error'
            self.metrics['errors'].append({
                'timestamp': datetime.now().isoformat(),
                'message': f'Parser error: {str(e)}'
            })
        
        return events
    
    def get_metrics(self) -> Dict:
        """Get current metrics snapshot"""
        return self.metrics.copy()
    
    def get_summary(self) -> str:
        """Get human-readable summary"""
        summary = []
        summary.append(f"Status: {self.metrics['status']}")
        summary.append(f"NGAP: {self.metrics['ngap_status']}")
        summary.append(f"Connected UEs: {self.metrics['ue_connections']}")
        
        if self.metrics['cell_info']:
            ci = self.metrics['cell_info']
            summary.append(f"Cell: PCI={ci.get('pci')}, BW={ci.get('bandwidth_mhz')}MHz, Band n{ci.get('band')}")
        
        summary.append(f"Errors: {len(self.metrics['errors'])}")
        summary.append(f"Warnings: {len(self.metrics['warnings'])}")
        
        return " | ".join(summary)


if __name__ == "__main__":
    # Test the parser
    parser = GnbLogParser()
    
    # Test with sample log lines
    test_lines = [
        "2025-12-26T15:32:21.460668 Cell pci=1, bw=10 MHz, 1T1R, dl_arfcn=368500 (n3), dl_freq=1842.5 MHz, dl_ssb_arfcn=368410, ul_freq=1747.5 MHz",
        "2025-12-26T15:32:21.460680 N2: Connection to AMF on 127.0.0.5:38412 completed",
        "2025-12-26T15:32:22.460680 [zmq:rx:0:0] [I] Waiting for data.",
    ]
    
    for line in test_lines:
        event = parser.parse_line(line)
        if event:
            print(f"Event: {event}")
    
    print(f"\nSummary: {parser.get_summary()}")
    print(f"\nMetrics: {json.dumps(parser.get_metrics(), indent=2)}")
