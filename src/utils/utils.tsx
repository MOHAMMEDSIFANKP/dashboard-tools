import { AgGridReact } from "ag-grid-react";

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export function formatMicroIsoDate(
  raw: string | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' }
): string {
  if (typeof raw !== 'string') return '';
  const truncated = typeof raw === 'string' ? raw.slice(0, 23) : null;
  const date = truncated ? new Date(truncated) : null;
  return date ? date.toLocaleDateString() : '';
}

export const AGchartcaptureChartScreenshot = (chartRef: React.RefObject<HTMLDivElement>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!chartRef.current) {
      reject(new Error('Chart element not found'));
      return;
    }

    const canvas = chartRef.current.querySelector('canvas');
    if (canvas) {
      try {
        const imageData = canvas.toDataURL('image/png');
        resolve(imageData);
      } catch (err) {
        reject(new Error('Failed to capture chart screenshot'));
      }
    } else {
      reject(new Error('Canvas element not found'));
    }
  });
};

export const ChartJscaptureChartScreenshot = (chartRef: React.RefObject<any>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!chartRef.current) {
      reject(new Error('Chart element not found'));
      return;
    }

    try {
      // For Chart.js, we use the chart instance's toBase64Image method
      const imageData = chartRef.current.toBase64Image('image/png');
      resolve(imageData);
    } catch (err) {
      reject(new Error('Failed to capture chart screenshot'));
    }
  });
};


export const PlotlyCaptureChartScreenshot = (plotRef: React.RefObject<any>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!plotRef.current?.el) {
      reject(new Error('Plotly chart element not found'));
      return;
    }

    try {
      // Use Plotly's toImage method to get the image data
      // @ts-ignore
      Plotly.toImage(plotRef.current.el, {
        format: 'png',
        width: 800,
        height: 600
      }).then((imageData: string) => {
        resolve(imageData);
      }).catch((err: Error) => {
        reject(new Error('Failed to export Plotly chart image'));
      });
    } catch (err) {
      reject(new Error('Failed to capture Plotly chart screenshot'));
    }
  });
};

export const NivoCaptureChartScreenshot = (chartContainerRef: React.RefObject<HTMLDivElement>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!chartContainerRef.current) {
      reject(new Error('Chart container not found'));
      return;
    }

    try {
      // Find the SVG element within the container
      const svgElement = chartContainerRef.current.querySelector('svg');
      if (!svgElement) {
        reject(new Error('SVG element not found'));
        return;
      }

      // Serialize the SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      // Create canvas to render the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Set canvas dimensions
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;

      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        resolve(imageData);
      };
      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    } catch (err) {
      reject(new Error('Failed to capture Nivo chart screenshot'));
    }
  });
};

export const VictoryCaptureChartScreenshot = (chartContainerRef: React.RefObject<HTMLDivElement>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!chartContainerRef.current) {
      reject(new Error('Chart container not found'));
      return;
    }

    try {
      const svgElements = chartContainerRef.current.querySelectorAll('svg');
      
      if (svgElements.length === 0) {
        reject(new Error('No SVG elements found'));
        return;
      }

      const containerRect = chartContainerRef.current.getBoundingClientRect();
      
      // Create canvas with container dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Set canvas size to match container
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;

      // Fill canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let loadedCount = 0;
      const totalSvgs = svgElements.length;

      // Process each SVG element
      svgElements.forEach((svgElement, index) => {
        const svgRect = svgElement.getBoundingClientRect();
        
        // Calculate relative position within the container
        const offsetX = svgRect.left - containerRect.left;
        const offsetY = svgRect.top - containerRect.top;

        // Serialize the SVG
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);
        
        // Add XML declaration and ensure proper namespace
        if (!svgString.includes('xmlns')) {
          svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        }

        // Create image for this SVG
        const img = new Image();
        
        img.onload = () => {
          try {
            // Draw this SVG at its relative position
            ctx.drawImage(img, offsetX, offsetY, svgRect.width, svgRect.height);
            loadedCount++;
            
            // When all SVGs are loaded, resolve with the combined image
            if (loadedCount === totalSvgs) {
              const imageData = canvas.toDataURL('image/png');
              resolve(imageData);
            }
          } catch (drawError:any) {
            reject(new Error(`Failed to draw SVG ${index}: ${drawError.message}`));
          }
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load SVG ${index}`));
        };

        // Convert SVG to data URL
        const encodedSvg = btoa(unescape(encodeURIComponent(svgString)));
        img.src = `data:image/svg+xml;base64,${encodedSvg}`;
      });

    } catch (err:any) {
      reject(new Error(`Failed to capture Victory chart screenshot: ${err.message}`));
    }
  });
};

export const EChartsCaptureChartScreenshot = (chartRef: React.RefObject<any>): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if the ref exists and has an ECharts instance
      if (!chartRef.current) {
        reject(new Error('Chart container not found'));
        return;
      }

      const instance = chartRef.current.getEchartsInstance 
        ? chartRef.current.getEchartsInstance() 
        : null;

      if (!instance) {
        reject(new Error('ECharts instance not found'));
        return;
      }

      const imageData = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      resolve(imageData);
    } catch (err) {
      reject(new Error('Failed to capture ECharts screenshot'));
    }
  });
};

// Tables
export const AGGridCaptureScreenshot = (gridRef: React.RefObject<AgGridReact>): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!gridRef.current) {
      reject(new Error('Grid reference not found'));
      return;
    }

    try {
      const gridApi = gridRef.current.api;
      if (!gridApi) {
        reject(new Error('Grid API not found'));
        return;
      }

      // Get the actual grid container
      const gridElement = document.querySelector('.ag-theme-alpine') as HTMLElement;
      if (!gridElement) {
        reject(new Error('Grid container not found'));
        return;
      }

      // Create canvas with proper sizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = 1400; // Wide enough for all columns
      canvas.height = 800;  // Tall enough for multiple rows

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title styling
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('AG Grid - Financial Data Export', 20, 35);

      // Get actual data from grid
      const columns = gridApi.getColumns() || [];
      const displayedRowCount = gridApi.getDisplayedRowCount();
      
      // Subtitle with real stats
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`Rows: ${displayedRowCount} | Columns: ${columns.length}`, 20, 60);
      ctx.fillText(`Exported on: ${new Date().toLocaleString()}`, 20, 80);

      // Table setup
      const startY = 110;
      const rowHeight = 35;
      const headerHeight = 40;
      let currentX = 20;
      const columnWidths: number[] = [];

      // Calculate column widths based on header text
      columns.forEach((col, index) => {
        const colDef = col.getColDef();
        const headerName = colDef.headerName || colDef.field || '';
        // Minimum width based on content, max 150px
        const width = Math.min(Math.max(headerName.length * 8 + 20, 80), 150);
        columnWidths.push(width);
      });

      // Draw header background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20, startY, canvas.width - 40, headerHeight);
      
      // Draw header border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, startY, canvas.width - 40, headerHeight);

      // Draw column headers with real names
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Arial';
      currentX = 25;

      columns.forEach((col, index) => {
        if (currentX > canvas.width - 100) return; // Stop if we run out of space
        
        const colDef = col.getColDef();
        const headerName = colDef.headerName || colDef.field || '';
        const truncatedHeader = headerName.length > 15 ? headerName.substring(0, 12) + '...' : headerName;
        
        ctx.fillText(truncatedHeader, currentX, startY + 25);
        
        // Draw vertical separator
        if (index < columns.length - 1) {
          ctx.beginPath();
          ctx.moveTo(currentX + columnWidths[index] - 5, startY);
          ctx.lineTo(currentX + columnWidths[index] - 5, startY + headerHeight);
          ctx.stroke();
        }
        
        currentX += columnWidths[index];
      });

      // Draw data rows with real data
      ctx.font = '11px Arial';
      const maxRows = Math.min(displayedRowCount, 15); // Show up to 15 rows
      
      for (let i = 0; i < maxRows; i++) {
        const rowNode = gridApi.getDisplayedRowAtIndex(i);
        if (!rowNode) continue;

        const y = startY + headerHeight + (i * rowHeight);
        
        // Alternate row colors
        if (i % 2 === 0) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(20, y, canvas.width - 40, rowHeight);
        }

        // Draw row border
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(20, y, canvas.width - 40, rowHeight);

        // Draw cell data
        ctx.fillStyle = '#4b5563';
        currentX = 25;

        columns.forEach((col, colIndex) => {
          if (currentX > canvas.width - 100) return;
          
          const colDef = col.getColDef();
          const field = colDef.field;
          let cellValue = '';
          
          if (field && rowNode.data) {
            const rawValue = rowNode.data[field];
            if (rawValue !== null && rawValue !== undefined) {
              // Format numbers with commas if they look like numbers
              if (typeof rawValue === 'number') {
                cellValue = rawValue.toLocaleString();
              } else {
                cellValue = String(rawValue);
              }
            }
          }

          // Truncate long values
          const truncatedValue = cellValue.length > 20 ? cellValue.substring(0, 17) + '...' : cellValue;
          
          ctx.fillText(truncatedValue, currentX, y + 22);
          currentX += columnWidths[colIndex];
        });
      }

      // Add footer information
      const footerY = startY + headerHeight + (maxRows * rowHeight) + 20;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      
      if (displayedRowCount > maxRows) {
        ctx.fillText(`Showing first ${maxRows} rows of ${displayedRowCount} total rows`, 20, footerY);
      } else {
        ctx.fillText(`Showing all ${displayedRowCount} rows`, 20, footerY);
      }
      
      ctx.fillText('For complete data export, use the CSV export feature', 20, footerY + 20);

      // Add a subtle border around the entire table
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, startY - 2, canvas.width - 36, headerHeight + (maxRows * rowHeight) + 4);

      const imageData = canvas.toDataURL('image/png');
      resolve(imageData);
    } catch (err) {
      console.error('Screenshot capture error:', err);
      reject(new Error('Failed to capture AG Grid screenshot'));
    }
  });
};


export const TanStackTableCaptureScreenshot = (tableRef: React.RefObject<HTMLElement>): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!tableRef.current) {
        reject(new Error('Table element not found'));
        return;
      }

      // Use html-to-image library to capture the table
      import('html-to-image').then(({ toPng }) => {
        toPng(tableRef.current as HTMLElement)
          .then((dataUrl) => {
            resolve(dataUrl);
          })
          .catch((err) => {
            reject(new Error('Failed to capture table screenshot'));
          });
      });
    } catch (err) {
      reject(new Error('Failed to capture table screenshot'));
    }
  });
};

export const ReactTableCaptureScreenshot = (tableRef: React.RefObject<HTMLElement>): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!tableRef.current) {
        reject(new Error('Table element not found'));
        return;
      }
      // Use html-to-image library to capture the table
      import('html-to-image').then(({ toPng }) => {
        toPng(tableRef.current as HTMLElement)
          .then((dataUrl) => {
            resolve(dataUrl);
          })
          .catch((err) => {
            reject(new Error('Failed to capture table screenshot'));
          });
      });
    } catch (err) {
      reject(new Error('Failed to capture table screenshot'));
    }
  });
};
