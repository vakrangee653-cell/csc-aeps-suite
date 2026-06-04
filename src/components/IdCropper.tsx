import React, { useState, useEffect, useRef } from 'react';
import { Crop, Upload, RefreshCw, Printer, Download } from 'lucide-react';

export default function IdCropper() {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontName, setFrontName] = useState('');
  const [backName, setBackName] = useState('');
  const [layout, setLayout] = useState<'id-card' | 'a4-stacked'>('id-card');
  const [scale, setScale] = useState(100);
  const [contrast, setContrast] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    drawCanvasPreview();
  }, [frontImage, backImage, layout, scale, contrast]);

  const drawCanvasPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas - standard printable high-res A4 proportion: 842 x 595 (landscape) or similar aspect
    canvas.width = 800;
    canvas.height = 550;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw borders & guidelines
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.setLineDash([]);

    // Standard printable spacing
    const scaleFactor = scale / 100;
    const contrastFactor = contrast / 100;

    // Standard ID Card dimension: 8.5 x 5.5 cm -> pixels: ~320 x 206
    const baseW = 320 * scaleFactor;
    const baseH = 206 * scaleFactor;

    const drawSingleSide = (imgSrc: string | null, label: string, x: number, y: number) => {
      // Draw background preview shadow box
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(x, y, baseW, baseH);
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, baseW, baseH);

      if (imgSrc) {
        const image = new Image();
        image.onload = () => {
          ctx.save();
          // Apply contrast filter via canvas filters (modern approach)
          if (contrast !== 100) {
            ctx.filter = `contrast(${contrast}%)`;
          }
          ctx.drawImage(image, x + 2, y + 2, baseW - 4, baseH - 4);
          ctx.restore();
        };
        image.src = imgSrc;
      } else {
        // Draw placeholder text
        ctx.fillStyle = '#6B7280';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`[ ${label} Placeholder ]`, x + baseW / 2, y + baseH / 2 - 5);
        ctx.font = '10px sans-serif';
        ctx.fillText("Upload card image above", x + baseW / 2, y + baseH / 2 + 15);
      }
    };

    if (layout === 'id-card') {
      // Render Side by Side (standard front on left, back on right)
      const spacing = 30;
      const totalW = (baseW * 2) + spacing;
      const startX = (canvas.width - totalW) / 2;
      const startY = (canvas.height - baseH) / 2;

      drawSingleSide(frontImage, "ID Front Side", startX, startY);
      drawSingleSide(backImage, "ID Back Side", startX + baseW + spacing, startY);
    } else {
      // Render vertical Stacked
      const spacing = 20;
      const totalH = (baseH * 2) + spacing;
      const startX = (canvas.width - baseW) / 2;
      const startY = (canvas.height - totalH) / 2;

      drawSingleSide(frontImage, "Document Top Front", startX, startY);
      drawSingleSide(backImage, "Document Bottom Back", startX, startY + baseH + spacing);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file only.');
        return;
      }
      if (side === 'front') setFrontName(file.name);
      else setBackName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (side === 'front') setFrontImage(event.target.result as string);
          else setBackImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `smartspe_id_aligned_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Open new clean print frame modal in browser
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to launch print job sheets.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartSpe - Dynamic ID Alignment Print Job</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #fff; }
            img { max-width: 100%; height: auto; }
            @page { size: A4 portrait; margin: 10mm; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontName('');
    setBackName('');
    setScale(100);
    setContrast(100);
  };

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <Crop className="w-5 h-5 shrink-0" />
          Aadhaar & Voter Card Alignment Layer
        </h2>
        <span className="text-xs bg-emerald-500/10 text-emerald-500 font-bold px-3 py-1.5 rounded-full select-none">
          Standard 8.5cm x 5.5cm Print Width Configured
        </span>
      </div>

      <div className="tool-layout">
        
        {/* CONFIG COLUMN */}
        <div className="config-card">
          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            1. Select Image Paths
          </h3>
          <p className="text-xs text-gray-500">Drag or browse PNG / JPG photos of your customer cards.</p>

          <div className="form-group">
            <label className="text-xs font-extrabold uppercase">Card Front side</label>
            <div className="upload-zone relative">
              <Upload className="w-8 h-8 upload-icon mb-2" />
              <span className="upload-text text-xs text-gray-400">Click to upload Front image</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'front')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {frontName && <span className="file-preview-name mt-1 text-xs truncate max-w-[200px]">{frontName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="text-xs font-extrabold uppercase">Card Back side</label>
            <div className="upload-zone relative">
              <Upload className="w-8 h-8 upload-icon mb-2" />
              <span className="upload-text text-xs text-gray-400">Click to upload Back image</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'back')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {backName && <span className="file-preview-name mt-1 text-xs truncate max-w-[200px]">{backName}</span>}
            </div>
          </div>

          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800/80 pb-2 pt-2">
            2. Realignment Toggles
          </h3>

          <div className="form-group">
            <label htmlFor="layout-style-select">Format Print Style</label>
            <select 
              id="layout-style-select" 
              value={layout} 
              onChange={(e) => setLayout(e.target.value as any)}
              className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
            >
              <option value="id-card">Side-by-Side (Standard ID Card printout)</option>
              <option value="a4-stacked">A4 Document Stacked (Double aligned vertical)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="flex justify-between text-xs">
              <span>Card Scale Size</span>
              <span>{scale}%</span>
            </label>
            <div className="slider-group">
              <input 
                type="range" 
                min={50} 
                max={150} 
                value={scale} 
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-gray-200"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="flex justify-between text-xs">
              <span>Photoshop Contrast Adjust</span>
              <span>{contrast}%</span>
            </label>
            <div className="slider-group">
              <input 
                type="range" 
                min={50} 
                max={150} 
                value={contrast} 
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-gray-200"
              />
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleReset}
            className="btn-secondary flex items-center justify-center gap-2 py-3 border border-gray-200 text-xs text-gray-600 dark:text-gray-400 font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Crop Parameters
          </button>
        </div>

        {/* CANVAS PREVIEW COLUMN */}
        <div className="preview-card bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h3 className="font-extrabold text-[#06B6D4] text-xs uppercase tracking-widest mb-2">Print Layout preview sheet</h3>
          
          <div className="canvas-wrapper p-3 bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-full flex items-center justify-center">
            <canvas ref={canvasRef} className="shadow-lg rounded-sm max-w-full" style={{ maxHeight: '350px' }}></canvas>
          </div>

          <div className="btn-group mt-4 w-full">
            <button 
              type="button" 
              onClick={handleDownload}
              className="btn-secondary w-full py-3 text-xs"
            >
              <Download className="w-4 h-4" />
              Download Image PNG
            </button>
            
            <button 
              type="button" 
              onClick={handlePrint}
              disabled={!frontImage && !backImage}
              className="btn-primary w-full py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Direct Window Print
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
