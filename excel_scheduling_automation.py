import pandas as pd
import calendar
from datetime import datetime
import re

def generate_schedule_final(input_file, output_file, target_month=11, target_year=2025):
    try:
        # 1. Đọc file (Dùng read_excel nếu là file .xls thật)
        # Ở đây tôi dùng read_csv dựa trên dữ liệu bạn gửi
        df = pd.read_csv(input_file, header=None)
        
        # 2. Bản đồ thứ
        weekday_map = {
            'thứ 2': 0, 't2': 0, 'thứ hai': 0,
            'thứ 3': 1, 't3': 1, 'thứ ba': 1,
            'thứ 4': 2, 't4': 2, 'thứ tư': 2,
            'thứ 5': 3, 't5': 3, 'thứ năm': 3,
            'thứ 6': 4, 't6': 4, 'thứ sáu': 4, 't6': 4,
            'thứ 7': 5, 't7': 5, 'thứ bảy': 5,
            'cn': 6, 'chủ nhật': 6
        }

        # Tạo danh sách các ngày trong tháng mục tiêu cho từng thứ
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        calendar_days = {i: [] for i in range(7)}
        for d in range(1, days_in_month + 1):
            wd = calendar.weekday(target_year, target_month, d)
            # Định dạng: DD/MM/YYYY (Thứ)
            day_str = f"{d:02d}/{target_month:02d}/{target_year}"
            calendar_days[wd].append(day_str)

        # 3. Tạo một bản sao để điền dữ liệu mới
        # Xóa sạch các ô ngày tháng cũ nhưng giữ lại các ô tiêu đề "(lớp...)"
        new_df = df.copy()
        
        # Duyệt qua từng cột
        for c in range(df.shape[1]):
            for r in range(df.shape[0]):
                cell_val = str(df.iloc[r, c]).lower()
                
                # Nếu tìm thấy ô tiêu đề lớp (ví dụ: "(lớp 2) thứ 5, thứ 7")
                if "(lớp" in cell_val and "thứ" in cell_val:
                    # Tìm tất cả các thứ được nhắc đến trong ô này
                    found_wds = []
                    for key, val in weekday_map.items():
                        if key in cell_val:
                            found_wds.append(val)
                    
                    # Lấy tất cả các ngày trong tháng thuộc các thứ đó, sắp xếp tăng dần
                    all_dates = []
                    for wd in set(found_wds):
                        all_dates.extend(calendar_days[wd])
                    
                    # Sắp xếp ngày theo đúng trình tự thời gian
                    all_dates.sort(key=lambda x: datetime.strptime(x.split(' ')[0], "%d/%m/%Y"))
                    
                    # Điền các ngày này xuống các dòng phía dưới ô tiêu đề
                    for i, date_text in enumerate(all_dates):
                        if r + 1 + i < new_df.shape[0]:
                            # Kiểm tra nếu chạm phải "Tổng ... buổi" thì dừng lại
                            current_val = str(df.iloc[r + 1 + i, c])
                            if "Tổng" in current_val or "(lớp" in current_val:
                                break
                            new_df.iloc[r + 1 + i, c] = date_text

        # 4. Xuất file
        new_df.to_excel(output_file, index=False, header=False)
        print(f"✅ Đã cập nhật xong lịch tháng {target_month}/{target_year} vào template!")

    except Exception as e:
        print(f"❗ Lỗi: {e}")

# Sử dụng: Bạn có thể chỉnh tháng/năm tùy ý ở đây
generate_schedule_final('template_chua_xong.csv', 'Ket_Qua_Thang_11.xlsx', target_month=11, target_year=2025)