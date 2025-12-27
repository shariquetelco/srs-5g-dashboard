#!/bin/bash
# srsRAN 5G Dashboard Startup Script

echo "=========================================="
echo "srsRAN 5G Dashboard"
echo "=========================================="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check if dependencies are installed
echo "Checking dependencies..."
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt --break-system-packages
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "Starting dashboard..."
echo "Dashboard will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

# Start the dashboard
python3 app.py
