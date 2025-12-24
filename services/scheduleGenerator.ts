import { ProcessResult } from '../types';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;

// The Python script to execute
const PYTHON_SCRIPT = `
import openpyxl
import io
import calendar
import re

def normalize(text):
    if not text: return ""
    text = str(text).lower()
    # Manual map for Vietnamese accents to standard ascii
    chars = {
        'á':'a','à':'a','ả':'a','ã':'a','ạ':'a',
        'ă':'a','ắ':'a','ằ':'a','ẳ':'a','ẵ':'a','ặ':'a',
        'â':'a','ấ':'a','ầ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'đ':'d',
        'é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e',
        'ê':'e','ế':'e','ề':'e','ể':'e','ễ':'e','ệ':'e',
        'í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o',
        'ô':'o','ố':'o','ồ':'o','ổ':'o','ỗ':'o','ộ':'o',
        'ơ':'o','ớ':'o','ờ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u',
        'ư':'u','ứ':'u','ừ':'u','ử':'u','ữ':'u','ự':'u',
        'ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y'
    }
    for k, v in chars.items():
        text = text.replace(k, v)
    return text

def get_dates(year, month, weekdays):
    # weekdays: set of ints (0=Mon, 6=Sun)
    c = calendar.Calendar(firstweekday=0)
    dates = []
    for d in c.itermonthdates(year, month):
        if d.month == month and d.year == year:
            if d.weekday() in weekdays:
                # Format: DD/MM/YYYY (TX) or (CN)
                # Map Python 0-6 to VN T2-CN
                # 0=Mon -> T2
                wd_str = f"T{d.weekday() + 2}" if d.weekday() < 6 else "CN"
                fmt = f"{d.day:02d}/{d.month:02d}/{d.year} ({wd_str})"
                dates.append(fmt)
    # Sort by day
    return sorted(dates, key=lambda x: int(x.split('/')[0]))

def process_excel(file_bytes, target_month, target_year):
    log_messages = []
    processed_count = 0
    
    try:
        # Load workbook
        wb = openpyxl.load_workbook(io.BytesIO(bytes(file_bytes)))
        
        # Regex patterns for strict detection
        # (regex, day_index)
        patterns = [
            (r'\\b(t2|thu\\s*2|mon)\\b', 0),
            (r'\\b(t3|thu\\s*3|tue)\\b', 1),
            (r'\\b(t4|thu\\s*4|wed)\\b', 2),
            (r'\\b(t5|thu\\s*5)\\b', 3), # Removed loose 'thu' to avoid 'thu phi'
            (r'\\b(t6|thu\\s*6|fri)\\b', 4),
            (r'\\b(t7|thu\\s*7|sat)\\b', 5),
            (r'\\b(cn|chu\\s*nhat|sun)\\b', 6)
        ]
        
        for sheet in wb.worksheets:
            log_messages.append(f"--- Processing Sheet: {sheet.title} ---")
            
            # Limit scan range (Cols 1-50, Rows 1-150)
            for c in range(1, 51):
                for r in range(1, 151):
                    cell = sheet.cell(row=r, column=c)
                    val = cell.value
                    if not val: continue
                    
                    val_str = str(val)
                    val_norm = normalize(val_str)
                    
                    # 1. Identify Class Header
                    if "lop" in val_norm:
                        found_days = set()
                        
                        # Check strictly against patterns within this cell only
                        for pat, day_idx in patterns:
                            if re.search(pat, val_norm):
                                found_days.add(day_idx)
                        
                        if found_days:
                            processed_count += 1
                            day_names = [f"T{d+2}" if d<6 else "CN" for d in sorted(found_days)]
                            log_messages.append(f"Found class at {cell.coordinate}: '{val_str[:20]}...' -> Days: {','.join(day_names)}")
                            
                            # Generate dates for this specific class
                            dates = get_dates(target_year, target_month, found_days)
                            
                            # Fill data downwards
                            curr_r = r + 1
                            date_idx = 0
                            actual_count = 0
                            
                            while curr_r < r + 100: # Safety limit
                                target_cell = sheet.cell(row=curr_r, column=c)
                                t_val = target_cell.value
                                t_norm = normalize(str(t_val)) if t_val else ""
                                
                                # Stop if "Tổng" found
                                if "tong" in t_norm:
                                    target_cell.value = f"Tổng {actual_count:02d} buổi"
                                    # Ensure style if needed? openpyxl keeps style usually
                                    break
                                
                                # Stop if another "Lớp" found (don't overwrite next class)
                                if "lop" in t_norm and curr_r > r:
                                    break
                                
                                # Fill Logic
                                if date_idx < len(dates):
                                    target_cell.value = dates[date_idx]
                                    date_idx += 1
                                    actual_count += 1
                                else:
                                    # Clear old dates if any (clean up previous month's overflow)
                                    # We check if it looks like a date or is not empty
                                    if t_val:
                                        target_cell.value = None
                                
                                curr_r += 1
            
            # Update Title (Header)
            # Scan top area for title
            for r in range(1, 15):
                for c in range(1, 20):
                    cell = sheet.cell(row=r, column=c)
                    if cell.value:
                        norm = normalize(str(cell.value))
                        # Check "thang" and some context like "bang" or "hoc phi"
                        if "thang" in norm and ("bang" in norm or "hoc phi" in norm):
                             cell.value = f"BẢNG THU HỌC PHÍ LỚP GIA SƯ TIẾNG ANH - Tháng {target_month}/{target_year}"

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue(), log_messages, processed_count

    except Exception as e:
        import traceback
        return None, [str(e), traceback.format_exc()], 0
`;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;

  // Load pyodide script
  if (!window.loadPyodide) {
    throw new Error("Pyodide script not loaded in index.html");
  }

  const pyodide = await window.loadPyodide();
  
  // Install required packages
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install("openpyxl");
  
  pyodideInstance = pyodide;
  return pyodide;
}

export const generateSchedule = async (
  file: File,
  targetMonth: number,
  targetYear: number
): Promise<ProcessResult> => {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("⚙️ Đang khởi tạo môi trường Python (lần đầu có thể mất vài giây)...");
    const pyodide = await getPyodide();
    
    log(`📂 Đang đọc file: ${file.name}...`);
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    log("🐍 Đang chạy mã Python xử lý...");
    
    // Set globals for Python
    pyodide.globals.set("input_file_bytes", uint8Array);
    pyodide.globals.set("target_month", targetMonth);
    pyodide.globals.set("target_year", targetYear);

    // Execute the Python script
    // We define the functions then call the main process function
    await pyodide.runPythonAsync(PYTHON_SCRIPT);
    
    const resultProxy = await pyodide.runPythonAsync(`
        data, logs, count = process_excel(input_file_bytes, target_month, target_year)
        # Return as list to JS
        [data, logs, count]
    `);
    
    const resultArray = resultProxy.toJs();
    const resultBytes = resultArray[0]; // Uint8Array or null
    const pythonLogs = resultArray[1];  // Array of strings
    const count = resultArray[2];       // Integer

    // Cleanup proxy
    resultProxy.destroy();

    if (!resultBytes) {
      throw new Error(`Lỗi Python: ${pythonLogs}`); // If data is null, logs usually contain error
    }

    return {
      success: true,
      message: "Xử lý thành công",
      data: resultBytes,
      logs: [...logs, ...pythonLogs],
      processedClasses: count
    };

  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      message: error.message || "Lỗi không xác định khi chạy Python",
      logs: [...logs, `❌ Lỗi: ${error.message}`],
      processedClasses: 0
    };
  }
};
