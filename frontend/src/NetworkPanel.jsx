import React, { useEffect, useState } from "react";

export default function NetworkPanel() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/network-info")
            .then(r => r.json())
            .then(setData)
            .catch(e => setErr(String(e)));
    }, []);

    if (err) return <div className="p-4 text-red-600">Lỗi: {err}</div>;
    if (!data) return <div className="p-4">Đang tải...</div>;

    const adapters = Array.isArray(data.adapters) ? data.adapters : (data.adapters ? [data.adapters] : []);
    // Ưu tiên adapter có IPv4 + MAC
    const primary = adapters.find(a => (a.MACAddress && Array.isArray(a.IPAddress))) || adapters[0] || {};

    const ipv4 = (primary?.IPAddress || []).find(ip => ip && ip.includes("."));
    const ipv6 = (primary?.IPAddress || []).find(ip => ip && ip.includes(":"));
    const dnsList = primary?.DNSServerSearchOrder || [];
    const gateway = (primary?.DefaultIPGateway || [])[0] || "";

    const wifi = data.wifi || {};

    return (
        <div className="max-w-xl mx-auto p-6 rounded-xl shadow bg-white">
            <h2 className="text-xl font-semibold mb-4">Thông tin mạng</h2>

            {wifi?.ssid ? (
                <>
                    <div className="text-sm text-gray-500">SSID</div>
                    <div className="font-medium">{wifi.ssid}</div>

                    <div className="mt-4 text-sm">
                        <div className="text-gray-500">Network band (channel)</div>
                        <div>{wifi.channel ? `Channel ${wifi.channel}` : "—"}</div>
                        <div className="mt-2 text-gray-500">Aggregated link speed</div>
                        <div>{(wifi.rx_mbps || "?") + "/" + (wifi.tx_mbps || "?")} (Mbps)</div>
                    </div>
                    <div className="my-4 border-b" />
                </>
            ) : null}

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-gray-500">IPv4 address</div>
                    <div className="font-medium">{ipv4 || "—"}</div>
                </div>
                <div>
                    <div className="text-gray-500">IPv6 address</div>
                    <div className="font-medium">{ipv6 || "—"}</div>
                </div>

                <div>
                    <div className="text-gray-500">IPv4 DNS servers</div>
                    <div className="font-medium">{dnsList.join(", ") || "—"}</div>
                </div>
                <div>
                    <div className="text-gray-500">IPv6 default gateway</div>
                    <div className="font-medium">{gateway || "—"}</div>
                </div>

                <div>
                    <div className="text-gray-500">Description</div>
                    <div className="font-medium">{primary?.Description || "—"}</div>
                </div>
                <div>
                    <div className="text-gray-500">Physical address (MAC)</div>
                    <div className="font-medium">{primary?.MACAddress || "—"}</div>
                </div>
            </div>
        </div>
    );
}
