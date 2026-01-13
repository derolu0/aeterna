// Web Worker per geocoding
self.onmessage = function(e) {
    const { type, lat, lng } = e.data;
    
    if (type === 'REVERSE_GEOCODE') {
        reverseGeocode(lat, lng).then(address => {
            self.postMessage({
                type: 'GEOCODING_RESULT',
                address: address
            });
        }).catch(error => {
            self.postMessage({
                type: 'GEOCODING_ERROR',
                error: error.message
            });
        });
    }
};

async function reverseGeocode(lat, lng) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
        {
            headers: {
                'User-Agent': 'FontaneBeveriniNapoliWorker/1.0'
            }
        }
    );
    
    const data = await response.json();
    
    if (data && data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.house_number) parts.push(data.address.house_number);
        
        if (parts.length > 0) {
            return parts.join(', ');
        }
    }
    
    return null;
}