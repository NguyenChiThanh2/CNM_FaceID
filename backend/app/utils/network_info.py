import subprocess, json, sys

def _run_powershell(ps_script: str) -> str:
    cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script]
    out = subprocess.check_output(cmd)
    return out.decode("utf-8", errors="ignore")

def get_network_info():
    """
    Trả về dict:
    {
      "adapters": [ { "Description":..., "MACAddress":..., "IPAddress":[...], "DefaultIPGateway":[...], "DNSServerSearchOrder":[...] }, ... ],
      "wifi": { "ssid": "...", "rx_mbps": "...", "tx_mbps": "...", "channel": "..." }
    }
    """
    if not sys.platform.startswith("win"):
        return {"adapters": [], "wifi": {}, "error": "Windows-only implementation"}

    ps_adapters = r'''
    Get-CimInstance Win32_NetworkAdapterConfiguration |
      Where-Object {$_.IPEnabled -eq $true} |
      Select-Object Description, MACAddress, IPAddress, IPSubnet, DefaultIPGateway, DNSServerSearchOrder |
      ConvertTo-Json -Depth 5
    '''
    try:
        adapters_json = _run_powershell(ps_adapters)
        adapters = json.loads(adapters_json)
    except Exception:
        adapters = []

    try:
        wifi_txt = subprocess.check_output("netsh wlan show interfaces", shell=True).decode("utf-8", "ignore")
    except Exception:
        wifi_txt = ""

    ssid = rx = tx = channel = ""
    for line in wifi_txt.splitlines():
        if "SSID" in line and ":" in line and "BSSID" not in line:
            ssid = line.split(":", 1)[1].strip()
        if ("Receive" in line or "nhận" in line) and "Mbps" in line and ":" in line:
            rx = line.split(":", 1)[1].strip()
        if ("Transmit" in line or "truyền" in line) and "Mbps" in line and ":" in line:
            tx = line.split(":", 1)[1].strip()
        if ("Channel" in line or "Kênh" in line) and ":" in line:
            channel = line.split(":", 1)[1].strip()

    return {"adapters": adapters, "wifi": {"ssid": ssid, "rx_mbps": rx, "tx_mbps": tx, "channel": channel}}

def list_all_macs():
    """Lấy toàn bộ MAC đang IPEnabled."""
    info = get_network_info()
    adapters = info.get("adapters") or []
    if isinstance(adapters, dict):
        adapters = [adapters]
    macs = []
    for a in adapters:
        mac = a.get("MACAddress")
        if mac:
            macs.append(mac)
    return macs
