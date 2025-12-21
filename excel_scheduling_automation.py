import openpyxl
import calendar
from datetime import datetime
import os
import re

def generate_schedule_v9(input_file, output_file, target_month=11, target_year=2025):
    try:
        if not os.path.exists(input_file):
            print(f"❌ Không tìm thấy file: {input_file}")
            return

        # 1. MỞ FILE
        wb = openpyxl.load_workbook(input_file)
        sheet = wb.active
        
        # 2. CHUẨN BỊ LỊCH THÁNG
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        weekday_map = {
            't2':0, 'thứ 2':0, 'hai':0, 't3':1, 'thứ 3':1, 'ba':1,
            't4':2, 'thứ 4':2, 'tư':2, 't5':3, 'thứ 5':3, 'năm':3,
            't6':4, 'thứ 6':4, 'sáu':4, 't7':5, 'thứ 7':5, 'bảy':5,
            'cn':6, 'chủ nhật':6
        }
        
        calendar_dict = {i: [] for i in range(7)}
        for d in range(1, days_in_month + 1):
            wd = calendar.weekday(target_year, target_month, d)
            thu_str = f"T{wd+2}" if wd < 6 else "CN"
            calendar_dict[wd].append(f"{d:02d}/{target_month:02d}/{target_year} ({thu_str})")

        count_classes = 0

        # 3. QUÉT DỮ LIỆU
        for c in range(1, 50): 
            for r in range(1, 100):
                cell = sheet.cell(row=r, column=c)
                val = str(cell.value).lower() if cell.value else ""
                
                if "lớp" in val and any(t in val for t in weekday_map.keys()):
                    count_classes += 1
                    
                    found_wds = [idx for key, idx in weekday_map.items() if key in val]
                    all_dates = []
                    for wd in set(found_wds):
                        all_dates.extend(calendar_dict[wd])
                    all_dates.sort(key=lambda x: int(x[:2]))
                    
                    # 4. ĐIỀN NGÀY VÀ ĐẾM SỐ BUỔI
                    curr_r = r + 1
                    date_idx = 0
                    actual_count = 0 # Biến đếm số buổi thực tế đã điền
                    
                    while curr_r < 200:
                        target_cell = sheet.cell(row=curr_r, column=c)
                        target_val = str(target_cell.value).lower() if target_cell.value else ""
                        
                        # Nếu gặp ô "Tổng", cập nhật số buổi rồi dừng
                        if "tổng" in target_val:
                            # Cập nhật ô Tổng (ví dụ: "Tổng 08 buổi")
                            target_cell.value = f"Tổng {actual_count:02d} buổi"
                            break
                        
                        # Nếu gặp tiêu đề lớp khác thì dừng (trường hợp không có ô Tổng)
                        if "lớp" in target_val and curr_r > r + 1:
                            break
                        
                        if date_idx < len(all_dates):
                            target_cell.value = all_dates[date_idx]
                            date_idx += 1
                            actual_count += 1
                        else:
                            target_cell.value = "" # Xóa ngày cũ thừa
                        curr_r += 1

        # 5. CẬP NHẬT TIÊU ĐỀ THÁNG (Tùy chọn)
        # Tìm ô chứa chữ "Tháng" ở đầu file để cập nhật
        for r in range(1, 5):
            for c in range(1, 10):
                cell = sheet.cell(row=r, column=c)
                if cell.value and "Tháng" in str(cell.value):
                    cell.value = f"BẢNG THU HỌC PHÍ LỚP GIA SƯ TIẾNG ANH - Tháng {target_month}/{target_year}"

        wb.save(output_file)
        print(f"\n🚀 HOÀN TẤT!")
        print(f"- Đã xử lý {count_classes} lớp.")
        print(f"- Đã cập nhật số buổi học cho từng lớp.")
        print(f"- File kết quả: {output_file}")

    except Exception as e:
        print(f"❗ LỖI: {e}")



import argparse
# Sử dụng argparse để xử lý đối số dòng lệnh
parser = argparse.ArgumentParser(description="Lấy các ngày trong tháng là thứ nhất định")
parser.add_argument("--manual", action="store_true", help="Nhập năm và tháng thủ công")
parser.add_argument("--manual-month", action="store_true", help="Nhập tháng thủ công (năm hiện tại)")
args = parser.parse_args()

if args.manual:
    # Nhập năm và tháng từ người dùng
    year = int(input("Nhập năm: "))
    month = int(input("Nhập tháng: "))
elif args.manual_month:
    now = datetime.now()
    year = now.year
    month = int(input("Nhập tháng: "))
else:
    # Lấy ngày giờ hiện tại
    now = datetime.now()
    # Lấy tháng và năm hiện tại
    month = now.month
    year = now.year

# Chạy lệnh
generate_schedule_v9("template.xlsx", f"Lich_Hoc_Thang_{month}.xlsx", month, year)

print("Nhấn Enter để kết thúc...")
input()