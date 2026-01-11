#!/usr/bin/env python3
from collections import deque
from datetime import datetime

class CallFlowParser:
    def __init__(self):
        self.messages = deque(maxlen=20)
        
    def parse_logs(self, log_file='/tmp/gnb.log'):
        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()[-100:]
                for line in lines:
                    self._extract_message(line)
        except:
            pass
        return list(self.messages)
    
    def _extract_message(self, line):
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        if 'NGAP' in line or 'N2:' in line:
            if 'Setup' in line or 'completed' in line:
                self.messages.append({
                    'time': timestamp,
                    'from': 'gNB',
                    'to': 'AMF',
                    'message': 'NGAP Setup Request'
                })
        elif 'gNB-N2 accepted' in line:
            self.messages.append({
                'time': timestamp,
                'from': 'AMF',
                'to': 'gNB',
                'message': 'NGAP Setup Response'
            })
        elif 'GTP' in line or 'N3' in line:
            self.messages.append({
                'time': timestamp,
                'from': 'gNB',
                'to': 'UPF',
                'message': 'GTP-U Tunnel Setup'
            })

call_flow_parser = CallFlowParser()
