#!/bin/bash

# IoT News Dashboard - Auto-Install & Start Script
# Built by IoTCommunity.Space - https://iotcommunity.space/

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VERSION=$(lsb_release -sr)
    elif [[ -f /etc/redhat-release ]]; then
        OS="CentOS"
        VERSION=$(rpm -q --queryformat '%{VERSION}' centos-release)
    else
        error "Cannot detect operating system"
        exit 1
    fi
    
    log "Detected OS: $OS $VERSION"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt-get update -y
        sudo apt-get upgrade -y
        sudo apt-get install -y curl wget gnupg lsb-release ca-certificates
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        sudo yum update -y
        sudo yum install -y curl wget gnupg ca-certificates
    elif [[ "$OS" == *"Fedora"* ]]; then
        sudo dnf update -y
        sudo dnf install -y curl wget gnupg ca-certificates
    else
        warn "Unsupported OS. Continuing anyway..."
    fi
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Remove old Docker versions
        sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Add Docker's official GPG key
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        # Remove old Docker versions
        sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
        
        # Add Docker repository
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        
        # Install Docker
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [[ "$OS" == *"Fedora"* ]]; then
        # Remove old Docker versions
        sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine 2>/dev/null || true
        
        # Add Docker repository
        sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
        
        # Install Docker
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker installed successfully!"
    info "You may need to log out and back in for Docker group permissions to take effect"
}

# Install Docker Compose (standalone version as fallback)
install_docker_compose() {
    log "Installing Docker Compose standalone..."
    
    # Get latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    # Download and install
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log "Docker Compose installed successfully!"
}

# Install Node.js and npm
install_nodejs() {
    log "Installing Node.js and npm..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Install Node.js 18.x from NodeSource
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        # Install Node.js 18.x from NodeSource
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
        
    elif [[ "$OS" == *"Fedora"* ]]; then
        # Install Node.js 18.x from NodeSource
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo dnf install -y nodejs
    fi
    
    # Verify installation
    node_version=$(node --version 2>/dev/null || echo "not found")
    npm_version=$(npm --version 2>/dev/null || echo "not found")
    
    log "Node.js version: $node_version"
    log "npm version: $npm_version"
}

# Check and install dependencies
check_and_install_dependencies() {
    log "🔍 Checking system dependencies..."
    
    # Detect OS first
    detect_os
    
    # Check if running as root (not recommended for Docker)
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. It's recommended to run as a regular user."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Update system first
    update_system
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        warn "Docker is not installed. Installing Docker..."
        install_docker
        
        # Refresh group membership without logout
        if [[ ! $EUID -eq 0 ]]; then
            exec sg docker "$0 $*"
        fi
    else
        log "✅ Docker is already installed: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        warn "Docker Compose is not installed. Installing Docker Compose..."
        install_docker_compose
    else
        if docker compose version &> /dev/null; then
            log "✅ Docker Compose (plugin) is available: $(docker compose version)"
        else
            log "✅ Docker Compose is already installed: $(docker-compose --version)"
        fi
    fi
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        warn "Node.js or npm is not installed. Installing Node.js..."
        install_nodejs
    else
        log "✅ Node.js is already installed: $(node --version)"
        log "✅ npm is already installed: $(npm --version)"
    fi
    
    # Verify Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Starting Docker..."
        sudo systemctl start docker
        sleep 5
        
        if ! docker info &> /dev/null; then
            error "Failed to start Docker. Please check your installation."
            exit 1
        fi
    fi
    
    log "✅ All dependencies are installed and ready!"
}

# Main startup function
start_iot_news_platform() {
    log "🚀 Starting IoT News API with MongoDB and Web Dashboard..."
    
    # Create necessary directories
    mkdir -p logs
    log "📁 Created logs directory"
    
    # Determine docker-compose command
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    log "Using command: $DOCKER_COMPOSE_CMD"
    
    # Stop any existing containers
    log "🛑 Stopping any existing containers..."
    $DOCKER_COMPOSE_CMD down 2>/dev/null || true
    
    # Start the services
    log "📦 Building and starting containers..."
    $DOCKER_COMPOSE_CMD up --build -d
    
    if [ $? -ne 0 ]; then
        error "Failed to start containers. Check the logs above."
        exit 1
    fi
    
    log "⏳ Waiting for services to be ready..."
    sleep 45
    
    log "🔍 Checking service health..."
    $DOCKER_COMPOSE_CMD ps
    
    # Health checks
    log "🏥 Performing health checks..."
    
    # Check API health
    for i in {1..30}; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            log "✅ API is responding"
            break
        fi
        if [ $i -eq 30 ]; then
            warn "API health check timeout"
        fi
        sleep 2
    done
    
    # Check Dashboard health
    for i in {1..30}; do
        if curl -s http://localhost:4000/health >/dev/null 2>&1; then
            log "✅ Dashboard is responding"
            break
        fi
        if [ $i -eq 30 ]; then
            warn "Dashboard health check timeout"
        fi
        sleep 2
    done
    
    # Display success message
    echo ""
    echo "🎉 IoT News Platform is running successfully!"
    echo ""
    echo "🌐 Services Available:"
    echo "   📰 Web Dashboard: http://localhost:4000"
    echo "   🔌 REST API: http://localhost:3000"
    echo "   📊 API Health: http://localhost:3000/health"
    echo "   🗄️  MongoDB Admin: http://localhost:8081 (admin/password123)"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View all logs: $DOCKER_COMPOSE_CMD logs -f"
    echo "   - Stop services: $DOCKER_COMPOSE_CMD down"
    echo "   - Restart: $DOCKER_COMPOSE_CMD restart"
    echo "   - Dashboard logs: $DOCKER_COMPOSE_CMD logs -f iot-news-dashboard"
    echo "   - API logs: $DOCKER_COMPOSE_CMD logs -f iot-news-api"
    echo ""
    echo "⏱️  The system will start fetching RSS feeds automatically in ~10 seconds"
    echo "📱 Access the Web Dashboard for full news management capabilities!"
