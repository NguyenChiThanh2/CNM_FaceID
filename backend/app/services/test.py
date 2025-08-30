# from datetime import datetime, date, time
# from decimal import Decimal

# from sqlalchemy.dialects.mysql import ENUM as MYSQL_ENUM

# from typing import Optional

# def tinh_so_cong_cho_1_ngay(check_in: Optional[datetime] , check_out: Optional[datetime] ) -> Decimal:
#     if not check_in or not check_out:
#         return Decimal("0")
# # theo thời gian việt nam
#     in_t = check_in.time()
#     out_t = check_out.time()




#     # tính giờ làm việc trong ngày
#     total_hours = Decimal("0")
#     # Morning window 08:00-12:00
#     a_start, a_end = time(8, 0), time(12, 0)
#     # Afternoon window 13:00-17:00
#     b_start, b_end = time(13, 0), time(17, 0)


#     def overlap_hours(s: time, e: time, ws: time, we: time) -> Decimal:
#         start = max(datetime.combine(date.min, s), datetime.combine(date.min, ws))
#         end = min(datetime.combine(date.min, e), datetime.combine(date.min, we))
#         delta = (end - start).total_seconds() / 3600
#         return Decimal(str(max(delta, 0)))


#     total_hours += overlap_hours(in_t, out_t, a_start, a_end)
#     total_hours += overlap_hours(in_t, out_t, b_start, b_end)


#     # 8 hours -> 1 công; 4 hours -> 0.5 công
#     if total_hours >= Decimal("7.5"):
#         return Decimal("1.00")
#     if total_hours >= Decimal("3.5"):
#         return Decimal("0.50")
#     return Decimal("0.00")

# check_in = datetime.strptime("8:00:00", "%H:%M:%S")
# check_out = datetime.strptime("14:30:00", "%H:%M:%S")
# print(tinh_so_cong_cho_1_ngay(check_in, check_out)) 

from flask import Flask, jsonify, request
from datetime import date, timedelta
import calendar


def tinh_ngay_cong(thang, nam):
    so_ngay = calendar.monthrange(nam, thang)[1]
    ngay_cong = 0
    for day in range(1, so_ngay + 1):
        d = date(nam, thang, day)
        if d.weekday() < 5:  # 0=Monday ... 4=Friday
            ngay_cong += 1
    return ngay_cong


print(tinh_ngay_cong(7, 2025))  
