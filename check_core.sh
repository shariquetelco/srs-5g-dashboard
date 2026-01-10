#!/bin/bash
echo "=== Open5GS Core Health Check bash by Ahmad Sharique ==="
echo ""

echo "Services Status:"
systemctl is-active open5gs-amfd open5gs-smfd open5gs-upfd open5gs-nrfd | \
  awk '{print "  Service " NR ": " $0}'
echo ""

echo "AMF NGAP Port (38412 - SCTP):"
sudo ss -lnp | grep 38412 || echo "  Not listening"
echo ""

echo "Subscribers in DB:"
mongosh --quiet --eval 'db.getSiblingDB("open5gs").subscribers.countDocuments()' 2>/dev/null
echo ""

echo "Recent AMF logs:"
sudo journalctl -u open5gs-amfd -n 5 --no-pager --output=short-precise 2>/dev/null
