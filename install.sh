#!/bin/bash
# IABG 5G srsRAN Dashboard - Automated Installation Script
# Author: Ahmad Sharique (ahmad@iabg.de)
# For Ubuntu 24.04 / WSL2

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}   IABG 5G srsRAN Dashboard - Installation Script${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Detected: $(lsb_release -d)"
    exit 1
fi

print_status "Detected: $(lsb_release -d | cut -f2)"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as normal user (script will use sudo when needed)"
    exit 1
fi

echo ""
print_info "This script will install:"
print_info "  - Docker and Docker Compose"
print_info "  - Python dependencies for dashboard"
print_info "  - srsRAN Project (optional)"
print_info "  - Open5GS 5G Core (optional)"
echo ""

read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installation cancelled"
    exit 0
fi

# Update system
echo ""
print_info "Updating system packages..."
sudo apt update -qq
print_status "System updated"

# Install Docker
echo ""
print_info "Installing Docker..."
if command -v docker &> /dev/null; then
    print_status "Docker already installed: $(docker --version)"
else
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully"
    print_info "Note: You may need to log out and back in for Docker permissions"
fi

# Install Python dependencies for dashboard
echo ""
print_info "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --break-system-packages -q
    print_status "Python dependencies installed"
else
    print_error "requirements.txt not found. Are you in the correct directory?"
    exit 1
fi

# Ask about full 5G stack installation
echo ""
read -p "Install full 5G stack (srsRAN + Open5GS)? This takes ~30 minutes (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    
    # Install build dependencies
    print_info "Installing build dependencies..."
    sudo apt install -y build-essential cmake libfftw3-dev libmbedtls-dev \
        libboost-program-options-dev libconfig++-dev libsctp-dev libtool \
        autoconf libzmq3-dev git libuhd-dev uhd-host libpcsclite-dev \
        libgnutls28-dev libssl-dev libyaml-cpp-dev libpthread-stubs0-dev \
        pkg-config curl gnupg
    print_status "Build dependencies installed"
    
    # Install MongoDB
    print_info "Installing MongoDB..."
    if ! command -v mongod &> /dev/null; then
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
            sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
            https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
            sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt update -qq
        sudo apt install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
        print_status "MongoDB installed and started"
    else
        print_status "MongoDB already installed"
    fi
    
    # Install Open5GS
    print_info "Installing Open5GS..."
    if ! command -v open5gs-amfd &> /dev/null; then
        sudo add-apt-repository ppa:open5gs/latest -y
        sudo apt update -qq
        sudo apt install -y open5gs
        sudo systemctl start open5gs-amfd open5gs-smfd open5gs-upfd \
            open5gs-nrfd open5gs-ausfd open5gs-udmd open5gs-pcfd open5gs-bsfd
        print_status "Open5GS installed and started"
        
        # Add test subscriber
        print_info "Adding test subscriber..."
        sudo open5gs-dbctl add 001010123456780 \
            00112233445566778899aabbccddeeff \
            63bfa50ee6523365ff14c1f45f88737d
        print_status "Test subscriber added (IMSI: 001010123456780)"
    else
        print_status "Open5GS already installed"
    fi
    
    # Install srsRAN Project
    print_info "Installing srsRAN Project..."
    if ! command -v gnb &> /dev/null; then
        WORK_DIR="/tmp/srsran_build"
        mkdir -p $WORK_DIR
        cd $WORK_DIR
        
        print_info "Cloning srsRAN Project..."
        git clone https://github.com/srsran/srsRAN_Project.git
        cd srsRAN_Project
        
        print_info "Building srsRAN (this takes ~15 minutes)..."
        mkdir build && cd build
        cmake ../ -DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON
        make -j$(nproc)
        sudo make install
        sudo ldconfig
        
        cd ~
        rm -rf $WORK_DIR
        print_status "srsRAN Project installed"
    else
        print_status "srsRAN already installed: $(gnb --version | head -1)"
    fi
fi

# Return to dashboard directory
cd "$(dirname "$0")"

# Build Docker image
echo ""
print_info "Building dashboard Docker image..."
docker build -t iabg-srsran-dashboard . -q
print_status "Docker image built"

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}   Installation Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
print_status "Dashboard installed successfully"
echo ""
print_info "To start the dashboard:"
echo -e "  ${BLUE}docker-compose up -d${NC}"
echo ""
print_info "To start manually:"
echo -e "  ${BLUE}python3 app.py${NC}"
echo ""
print_info "Dashboard URL:"
echo -e "  ${BLUE}http://localhost:5000${NC}"
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "To start the gNB:"
    echo -e "  ${BLUE}sudo gnb -c configs/gnb_zmq.yml${NC}"
    echo ""
fi

print_info "For full documentation, see: README.md"
echo ""
print_status "Happy monitoring! 🚀"
echo ""
