#!/usr/bin/env python3
"""
Farm AI Service Startup Script
Ensures all dependencies are installed and starts the Flask AI service
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    try:
        print("📦 Installing Python dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    except FileNotFoundError:
        print("❌ pip not found. Please ensure Python and pip are installed.")
        return False

def start_ai_service():
    """Start the AI service"""
    try:
        print("🤖 Starting Farm AI Service...")
        print("🌐 Service will be available at http://localhost:5000")
        print("📊 Health endpoint: http://localhost:5000/health")
        print("🔬 Prediction endpoint: http://localhost:5000/predict")
        print("\nPress Ctrl+C to stop the service\n")
        
        # Start the Flask app
        subprocess.call([sys.executable, "ai.py"])
    except KeyboardInterrupt:
        print("\n👋 AI service stopped by user")
    except Exception as e:
        print(f"❌ Failed to start AI service: {e}")

if __name__ == "__main__":
    print("🚀 Farm Management AI Service")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("ai.py"):
        print("❌ ai.py not found. Please run this script from the ai/ directory")
        sys.exit(1)
    
    # Install requirements
    if install_requirements():
        # Start the service
        start_ai_service()
    else:
        print("❌ Cannot start service due to dependency issues")
        sys.exit(1)