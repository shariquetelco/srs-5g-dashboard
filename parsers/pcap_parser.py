#!/usr/bin/env python3
import random
import math
from collections import deque
from datetime import datetime

class PCAPParser:
    def __init__(self):
        self.signal_power = deque(maxlen=50)
        self.frequency_data = deque(maxlen=50)
        self.iq_i = deque(maxlen=100)
        self.iq_q = deque(maxlen=100)
        self.time_counter = 0
        
    def parse_pcap(self, pcap_file='/tmp/gnb_mac.pcap'):
        self.time_counter += 1
        
        # Simulate signal power variations (-90 to -60 dBm)
        base_power = -75
        signal = base_power + 10 * math.sin(self.time_counter * 0.1) + random.uniform(-3, 3)
        self.signal_power.append(round(signal, 2))
        
        # Simulate frequency variations around 1842.5 MHz
        base_freq = 1842.5
        freq = base_freq + 0.5 * math.cos(self.time_counter * 0.15) + random.uniform(-0.1, 0.1)
        self.frequency_data.append(round(freq, 3))
        
        # Simulate IQ constellation (QPSK-like)
        for _ in range(10):
            angle = random.uniform(0, 2 * math.pi)
            radius = 0.7 + random.uniform(-0.2, 0.2)
            self.iq_i.append(round(radius * math.cos(angle), 3))
            self.iq_q.append(round(radius * math.sin(angle), 3))
        
        return {
            'signal_power': list(self.signal_power),
            'frequency': list(self.frequency_data),
            'iq_i': list(self.iq_i),
            'iq_q': list(self.iq_q),
            'channel_response': self._generate_channel_response()
        }
    
    def _generate_channel_response(self):
        # Simulate frequency response (52 subcarriers for 10MHz)
        response = []
        for i in range(52):
            magnitude = 1.0 - 0.3 * abs((i - 26) / 26) + random.uniform(-0.1, 0.1)
            response.append(round(magnitude, 3))
        return response

pcap_parser = PCAPParser()
