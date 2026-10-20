// === HELPER FUNCTIONS FOR CHARTS ===
// ==================== HELPER FUNCTIONS FOR CHARTS ====================

/**
 * Create SVG donut chart segments
 */
function createDonutChartSVG(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    return data.map(item => {
        if (item.value === 0) return '';
        
        const percentage = item.value / total;
        const dashLength = percentage * circumference;
        const gapLength = circumference - dashLength;
        
        const svg = `<circle cx="50" cy="50" r="${radius}" 
                          fill="transparent" 
                          stroke="${item.color}" 
                          stroke-width="20"
                          stroke-dasharray="${dashLength} ${gapLength}"
                          stroke-dashoffset="${-currentAngle * circumference}"
                          style="transition: all 0.5s ease;"
                        />`;
        
        currentAngle += percentage;
        return svg;
    }).join('');
}

/**
 * Export Named data to CSV
 */
function exportNamedData() {
    const namedData = getNamedData();
    
    if (namedData.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    let csv = 'Institusi,Tipe,Dokter,Dokter Gigi,Total,Persentase\n';
    const totalDokter = namedData.reduce((sum, i) => sum + i.dokter, 0);
    const totalDG = namedData.reduce((sum, i) => sum + i.dokterGigi, 0);
    const total = totalDokter + totalDG;
    
    namedData.forEach(inst => {
        const subtotal = inst.dokter + inst.dokterGigi;
        csv += `"${inst.nama}",${inst.tipe || ''},${inst.dokter},${inst.dokterGigi},${subtotal},${total > 0 ? ((subtotal/total)*100).toFixed(1) : '0'}%\n`;
    });
    csv += `"TOTAL",,${totalDokter},${totalDG},${total},100%\n`;
    
    downloadCSV(csv, 'named_dokter_data.csv');
}

/**
 * Export Nakes data to CSV
 */
function exportNakesData() {
    const institusiData = getInstitusiNakesData();
    
    if (institusiData.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    let csv = 'Institusi,Tipe,Perawat,Bidan,Apoteker,Lainnya,Total\n';
    
    institusiData.forEach(inst => {
        const total = inst.perawat + inst.bidan + inst.apoteker + inst.lainnya;
        csv += `"${inst.nama}",${inst.tipe || ''},${inst.perawat},${inst.bidan},${inst.apoteker},${inst.lainnya},${total}\n`;
    });
    
    const totals = [
        'TOTAL',
        '',
        institusiData.reduce((s,i)=>s+i.perawat,0),
        institusiData.reduce((s,i)=>s+i.bidan,0),
        institusiData.reduce((s,i)=>s+i.apoteker,0),
        institusiData.reduce((s,i)=>s+i.lainnya,0),
        institusiData.reduce((s,i)=>s+i.perawat+i.bidan+i.apoteker+i.lainnya,0)
    ];
    csv += totals.join(',') + '\n';
    
    downloadCSV(csv, 'nakes_institusi_data.csv');
}

/**
 * Download CSV file helper
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`File "${filename}" berhasil di-download!`, 'success');
}

