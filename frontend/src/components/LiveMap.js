import React, { useEffect, useRef } from 'react';

// Simple map using Leaflet via CDN (loaded in index.html)
export default function LiveMap({ lat = 12.9352, lng = 77.6245, zoom = 13, markers = [], height = 300 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;
    const map = window.L.map(mapRef.current).setView([lat, lng], zoom);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [lat, lng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markers.forEach(({ lat: mlat, lng: mlng, label, color = '#F59E0B', size = 12 }) => {
      const icon = window.L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [size, size],
        className: '',
      });
      const m = window.L.marker([mlat, mlng], { icon }).addTo(mapInstanceRef.current);
      if (label) m.bindTooltip(label, { permanent: false, direction: 'top' });
      markersRef.current.push(m);
    });
    if (markers.length > 0) {
      mapInstanceRef.current.setView([markers[0].lat, markers[0].lng], zoom);
    }
  }, [markers, zoom]);

  return (
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height }}>
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {!window.L && (
        <div style={styles.fallback}>
          <div style={styles.fallbackContent}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
            <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Map loading... Add Leaflet CDN to index.html</div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  fallback: { position: 'absolute', inset: 0, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fallbackContent: { textAlign: 'center' },
};
