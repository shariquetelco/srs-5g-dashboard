# srsRAN 5G Dashboard

Real-time monitoring dashboard for srsRAN Project gNB (5G base station). Built for network engineers and researchers working with open-source 5G networks.

![Dashboard Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

- **Real-time Monitoring**: Live updates every 2 seconds
- **gNB Status Tracking**: Cell configuration, NGAP connection, ZMQ status
- **Event Logging**: Track UE attachments, errors, and warnings
- **Web-based Interface**: Clean, responsive dashboard accessible from any browser
- **Log Parsing**: Intelligent parsing of srsRAN gNB logs
- **Alert System**: Visual indicators for errors and warnings

## 📸 Screenshots

*Dashboard showing active gNB with connected UE*

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- srsRAN Project gNB installed and configured
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shariquetelco/srs-5g-dashboard.git
cd srs-5g-dashboard
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Start your gNB**

Make sure your srsRAN gNB is running and logging to `/tmp/gnb.log`:
```bash
sudo gnb -c your_config.yml
```

4. **Start the dashboard**
```bash
python3 app.py
```

5. **Open browser**

Navigate to: http://localhost:5000

## 📊 Dashboard Components

### System Status
- gNB operational status
- NGAP connection to AMF
- ZMQ RF simulator status
- Number of connected UEs

### Cell Configuration
- Physical Cell ID (PCI)
- Bandwidth and NR band
- DL frequency and ARFCN
- Antenna configuration

### Alerts & Issues
- Real-time error tracking
- Warning notifications
- Timestamp and details for each alert

### Recent Events
- UE attachment events
- NGAP connection events
- System state changes

## 🔧 Configuration

### Custom Log File Location

Edit `app.py` to change the log file path:

```python
LOG_FILE = '/path/to/your/gnb.log'
```

### Update Interval

Modify the update frequency (in seconds):

```python
UPDATE_INTERVAL = 2  # Update every 2 seconds
```

### Port Configuration

Change the web server port:

```python
app.run(host='0.0.0.0', port=5000)
```

## 📁 Project Structure

```
srs-5g-dashboard/
├── app.py                    # Flask backend server
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── parsers/
│   └── gnb_parser.py        # Log parsing engine
├── static/
│   ├── css/
│   │   └── style.css        # Dashboard styling
│   └── js/
│       └── dashboard.js     # Frontend JavaScript
└── templates/
    └── dashboard.html       # HTML template
```

## 🔌 API Endpoints

The dashboard exposes a REST API for external integrations:

- `GET /api/metrics` - Current gNB metrics
- `GET /api/events` - Recent events
- `GET /api/summary` - Text summary
- `GET /api/health` - Health check
- `GET /api/config` - Dashboard configuration

Example:
```bash
curl http://localhost:5000/api/metrics
```

## 🧪 Testing

### With Sample Log File

Test the parser with sample data:

```bash
python3 parsers/gnb_parser.py
```

### With Live gNB

1. Start your gNB
2. Start the dashboard
3. Monitor real-time updates in your browser

## 🛠️ Troubleshooting

### Dashboard shows "Waiting for gNB"
- Ensure gNB is running
- Check log file path is correct (`/tmp/gnb.log`)
- Verify log file has read permissions

### No events appearing
- Wait for gNB to generate log entries
- Check UPDATE_INTERVAL setting
- Verify browser console for errors

### Connection issues
- Ensure port 5000 is not blocked by firewall
- Try accessing via 127.0.0.1 instead of localhost
- Check Flask server logs for errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Use Cases

This dashboard is useful for:

- **Development**: Real-time monitoring during gNB development
- **Testing**: Track UE attachments and protocol events
- **Debugging**: Quick identification of errors and warnings
- **Demonstrations**: Visual presentation of 5G network status
- **Research**: Data collection and analysis of gNB behavior

## 🏢 About

Developed for monitoring srsRAN Project deployments in:
- Defense and aerospace projects
- Research environments
- Educational institutions
- Private 5G networks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [srsRAN Project](https://www.srsran.com/) - Open source 5G RAN
- Built by [Sharique](https://github.com/shariquetelco)
- Developed for IABG mbH defense technology projects

## 📧 Contact

For questions or support:
- GitHub: [@shariquetelco](https://github.com/shariquetelco)
- Email: eshariq.am@gmail.com

## 🔮 Future Enhancements

- [ ] Historical data charts
- [ ] Multiple gNB monitoring
- [ ] Export metrics to CSV
- [ ] Alerting via email/Slack
- [ ] Performance analytics
- [ ] WebSocket for instant updates
- [ ] Docker containerization

---

**Built with ❤️ for the 5G open source community**
