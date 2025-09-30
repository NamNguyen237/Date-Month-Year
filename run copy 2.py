import calendar
import pyperclip
import datetime
import argparse

def get_days_for_weekdays(year, month, weekday1, weekday2, weekday3):
    # Tạo một lịch tháng
    cal = calendar.Calendar()
    days = []
    days2 = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    
    # Duyệt qua các ngày trong tháng
    for day in cal.itermonthdays2(year, month):
        if day[0] != 0:  # Loại bỏ các ngày không thuộc tháng hiện tại
            if day[1] == weekday1 or day[1] == weekday2 or day[1] == weekday3:
                days.append(f"{day[0]:02d}/{month:02d}/{year} ({days2[day[1]]})")
    
    return days

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
    now = datetime.datetime.now()
    year = now.year
    month = int(input("Nhập tháng: "))
else:
    # Lấy ngày giờ hiện tại
    now = datetime.datetime.now()
    # Lấy tháng và năm hiện tại
    month = now.month
    year = now.year

# Nhập thứ trong tuần từ người dùng (0: Thứ 2, 1: Thứ 3, ..., 6: Chủ nhật)
days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]

for i in range(7):
    print("{}. {}".format(i+2, days[i]))
day = int(input("Nhập thứ trong tuần (2: Thứ 2, 3: Thứ 3, ..., 8: Chủ nhật): "))
them = input("Xác nhận thứ? (0: OK, 1: Thêm thứ): ")
if them == "1":
    day2 = int(input("Nhập thứ trong tuần (2: Thứ 2, 3: Thứ 3, ..., 8: Chủ nhật): "))
    weekday2 = day2 - 2
    them2 = input("Xác nhận thứ thứ ba? (0: OK, 1: Thêm thứ): ")
    if them2 == "1":
        day3 = int(input("Nhập thứ trong tuần (2: Thứ 2, 3: Thứ 3, ..., 8: Chủ nhật): "))
        weekday3 = day3 - 2
    else:
        weekday3 = -1
else:
    weekday2 = -1
    weekday3 = -1
weekday1 = day - 2

output = ''
weekdays = get_days_for_weekdays(year, month, weekday1, weekday2, weekday3)
print(f"Các ngày trong tháng {month}/{year} là thứ {days[weekday1]}, thứ {days[weekday2]}, hoặc thứ {days[weekday3]}:\n")
for x in weekdays:
    print(x)
    output += x + "\n"
if len(weekdays) >= 10:
    sl = len(weekdays)
else:
    sl = f'0{len(weekdays)}'
print(f"Tổng {sl} buổi\n")

# Định dạng RTF cho dòng tổng in đậm
rtf_output = "{\\rtf1\\ansi\n"
for x in weekdays:
    rtf_output += x + "\\line\n"
rtf_output += f"\\b Tổng {sl} buổi\\b0\n"  # In đậm dòng tổng
rtf_output += "}"

output += f"Tổng {sl} buổi\n"
# Sao chép dữ liệu vào bộ nhớ tạm (RTF)
pyperclip.copy(rtf_output)
print("Dữ liệu đã được sao chép vào bộ nhớ tạm.")