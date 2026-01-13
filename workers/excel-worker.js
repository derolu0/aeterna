// Web Worker per elaborazione Excel
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'PROCESS_EXCEL') {
        try {
            const processedData = processExcelData(data);
            
            self.postMessage({
                type: 'EXCEL_PROCESSED',
                data: processedData
            });
        } catch (error) {
            self.postMessage({
                type: 'EXCEL_ERROR',
                error: error.message
            });
        }
    }
};

function processExcelData(data) {
    return data.map(item => ({
        ...item,
        processed: true,
        timestamp: new Date().toISOString()
    }));
}