/**
 * Excel / Spreadsheet Exporter Utility for MicroFin
 * Converts JSON datasets, nested reports, and tabular arrays into beautifully structured, multi-row, multi-column Excel (.xls / .xlsx) spreadsheets.
 */

// Format camelCase, PascalCase, or snake_case key into readable Title Case
export function formatHeader(key) {
  if (!key) return '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// Escape XML special characters for SpreadsheetML
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to build a table grid from an array of objects
function buildTableXml(items, sectionTitle = '') {
  if (!Array.isArray(items) || items.length === 0) return '';

  let xml = '';

  // Extract all distinct column keys across all items
  const headers = Array.from(
    items.reduce((keys, obj) => {
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(k => keys.add(k));
      }
      return keys;
    }, new Set())
  );

  if (headers.length === 0) {
    // Array of primitives (e.g. strings/numbers)
    if (sectionTitle) {
      xml += `
        <Row ss:Height="22">
          <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${escapeXml(sectionTitle)}</Data></Cell>
        </Row>
      `;
    }
    items.forEach((item, idx) => {
      const styleId = idx % 2 === 0 ? 'DataRowEven' : 'DataRowOdd';
      xml += `
        <Row ss:Height="20">
          <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(String(item))}</Data></Cell>
        </Row>
      `;
    });
    return xml;
  }

  // Section Header if provided
  if (sectionTitle) {
    xml += `
      <Row ss:Height="12"></Row>
      <Row ss:Height="24">
        <Cell ss:MergeAcross="${Math.max(headers.length - 1, 1)}" ss:StyleID="SectionHeader">
          <Data ss:Type="String">${escapeXml(sectionTitle)} (${items.length} Records)</Data>
        </Cell>
      </Row>
    `;
  }

  // Table Column Headers
  xml += `<Row ss:Height="24">`;
  headers.forEach(h => {
    xml += `
      <Cell ss:StyleID="Header">
        <Data ss:Type="String">${escapeXml(formatHeader(h))}</Data>
      </Cell>
    `;
  });
  xml += `</Row>`;

  // Table Data Rows
  items.forEach((row, rowIndex) => {
    const styleId = rowIndex % 2 === 0 ? 'DataRowEven' : 'DataRowOdd';
    xml += `<Row ss:Height="20">`;
    headers.forEach(h => {
      const val = row ? row[h] : '';
      let cellType = 'String';
      let cellValue = val;

      if (typeof val === 'number') {
        cellType = 'Number';
        cellValue = val;
      } else if (typeof val === 'boolean') {
        cellType = 'String';
        cellValue = val ? 'YES' : 'NO';
      } else if (val === null || val === undefined) {
        cellValue = '—';
      } else if (typeof val === 'object') {
        cellValue = Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
      }

      xml += `
        <Cell ss:StyleID="${styleId}">
          <Data ss:Type="${cellType}">${escapeXml(cellValue)}</Data>
        </Cell>
      `;
    });
    xml += `</Row>`;
  });

  return xml;
}

/**
 * Export tabular data (Array of Objects) or a Complex JSON Report to formatted Excel (.xls / .xlsx)
 * @param {Array|Object} data - The dataset or report object
 * @param {string} fileName - File name without extension
 * @param {string} sheetTitle - Sheet title / Header name
 */
export function exportToExcel(data, fileName = 'report', sheetTitle = 'MicroFin Report') {
  let rowsXml = '';

  // Title & Metadata Block at top of sheet
  rowsXml += `
    <Row ss:Height="28">
      <Cell ss:MergeAcross="6" ss:StyleID="Title">
        <Data ss:Type="String">${escapeXml(sheetTitle)}</Data>
      </Cell>
    </Row>
    <Row ss:Height="18">
      <Cell ss:MergeAcross="6" ss:StyleID="SubTitle">
        <Data ss:Type="String">Generated on: ${new Date().toLocaleString()} | MicroFin Loan Management System</Data>
      </Cell>
    </Row>
    <Row ss:Height="12"></Row>
  `;

  // CASE 1: Pure Array of Objects -> Single Direct Table
  if (Array.isArray(data)) {
    rowsXml += buildTableXml(data, '');
  }
  // CASE 2: Complex Object containing Summary Key-Values and/or Nested Arrays
  else if (typeof data === 'object' && data !== null) {
    const summaryEntries = [];
    const arrayEntries = [];

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        arrayEntries.push([key, value]);
      } else {
        summaryEntries.push([key, value]);
      }
    });

    // If there are summary key-value fields, render them cleanly at the top
    if (summaryEntries.length > 0) {
      rowsXml += `
        <Row ss:Height="22">
          <Cell ss:MergeAcross="1" ss:StyleID="SectionHeader">
            <Data ss:Type="String">Report Summary &amp; Overview</Data>
          </Cell>
        </Row>
        <Row ss:Height="22">
          <Cell ss:StyleID="Header"><Data ss:Type="String">Parameter</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
        </Row>
      `;

      summaryEntries.forEach(([k, v], idx) => {
        const styleId = idx % 2 === 0 ? 'DataRowEven' : 'DataRowOdd';
        let cellType = typeof v === 'number' ? 'Number' : 'String';
        let displayVal = v;
        if (typeof v === 'boolean') displayVal = v ? 'YES' : 'NO';
        else if (v === null || v === undefined) displayVal = '—';
        else if (typeof v === 'object') displayVal = JSON.stringify(v);

        rowsXml += `
          <Row ss:Height="20">
            <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(formatHeader(k))}</Data></Cell>
            <Cell ss:StyleID="${styleId}"><Data ss:Type="${cellType}">${escapeXml(displayVal)}</Data></Cell>
          </Row>
        `;
      });
    }

    // If there are nested array records (e.g. dataRecords, loans, borrowers, etc.), render each array as its own tabular table!
    if (arrayEntries.length > 0) {
      arrayEntries.forEach(([arrayKey, arrayItems]) => {
        rowsXml += buildTableXml(arrayItems, formatHeader(arrayKey));
      });
    }
  } else {
    // CASE 3: Plain String / Primitive
    rowsXml += `
      <Row ss:Height="20">
        <Cell ss:StyleID="DataRowEven"><Data ss:Type="String">${escapeXml(String(data || 'No content'))}</Data></Cell>
      </Row>
    `;
  }

  // Complete Excel 2003 XML Workbook (SpreadsheetML) with Rich Formatting
  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>MicroFin Loan Management System</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#10B981" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#059669"/>
   </Borders>
  </Style>
  <Style ss:ID="DataRowEven">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataRowOdd">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetTitle.slice(0, 31))}">
  <Table ss:DefaultColumnWidth="140" ss:DefaultRowHeight="20">
    ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  // Create Blob with Excel MIME type and trigger browser download
  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}
