#!/usr/bin/env python3
"""
Open5GS Core Status Checker
Checks status of Open5GS 5G core network functions
"""

import subprocess
from typing import Dict

class Open5GSChecker:
    """Check Open5GS service status"""
    
    def __init__(self):
        self.services = {
            'amf': 'open5gs-amfd',
            'smf': 'open5gs-smfd',
            'upf': 'open5gs-upfd',
            'nrf': 'open5gs-nrfd',
            'ausf': 'open5gs-ausfd',
            'udm': 'open5gs-udmd',
            'pcf': 'open5gs-pcfd',
            'bsf': 'open5gs-bsfd'
        }
    
    def check_service(self, service_name: str) -> str:
        """Check if a systemd service is running"""
        try:
            result = subprocess.run(
                ['systemctl', 'is-active', service_name],
                capture_output=True,
                text=True,
                timeout=2
            )
            status = result.stdout.strip()
            return 'running' if status == 'active' else 'stopped'
        except:
            return 'unknown'
    
    def get_all_status(self) -> Dict:
        """Get status of all Open5GS services"""
        status = {}
        running_count = 0
        
        for name, service in self.services.items():
            service_status = self.check_service(service)
            status[name] = service_status
            if service_status == 'running':
                running_count += 1
        
        # Overall status
        if running_count == len(self.services):
            status['overall'] = 'running'
        elif running_count > 0:
            status['overall'] = 'partial'
        else:
            status['overall'] = 'stopped'
        
        status['running_count'] = running_count
        status['total_count'] = len(self.services)
        
        return status

if __name__ == "__main__":
    checker = Open5GSChecker()
    status = checker.get_all_status()
    
    print(f"Open5GS Core Status: {status['overall']}")
    print(f"Running: {status['running_count']}/{status['total_count']}")
    print("\nServices:")
    for name in checker.services.keys():
        print(f"  {name.upper()}: {status[name]}")
