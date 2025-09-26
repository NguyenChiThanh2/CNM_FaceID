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
# -------------------------------------------------------------------------------
# from flask import Flask, jsonify, request
# from datetime import date, timedelta
# import calendar


# def tinh_ngay_cong(thang, nam):
#     so_ngay = calendar.monthrange(nam, thang)[1]
#     ngay_cong = 0
#     for day in range(1, so_ngay + 1):
#         d = date(nam, thang, day)
#         if d.weekday() < 5:  # 0=Monday ... 4=Friday
#             ngay_cong += 1
#     return ngay_cong


# print(tinh_ngay_cong(7, 2025))  


# from datetime import datetime, time

# def tinh_tre_som(thoigianvao: datetime, thoigianra: datetime):
#     # Mốc giờ chuẩn
#     gio_vao_chuan = time(8, 0)   # 08:01
#     gio_ra_chuan = time(17, 0)   # 17:00

#     # ---- TÍNH ĐI TRỄ ----
#     tre_phut = 0
#     if thoigianvao.time() > gio_vao_chuan:
#         diff = datetime.combine(thoigianvao.date(), thoigianvao.time()) - \
#                datetime.combine(thoigianvao.date(), gio_vao_chuan)
#         tre_phut = int(diff.total_seconds() // 60)

#     # ---- TÍNH VỀ SỚM ----
#     som_phut = 0
#     if thoigianra.time() < gio_ra_chuan:
#         diff = datetime.combine(thoigianra.date(), gio_ra_chuan) - \
#                datetime.combine(thoigianra.date(), thoigianra.time())
#         som_phut = int(diff.total_seconds() // 60)

#     return tre_phut, som_phut


# # ==========================
# # Ví dụ sử dụng:
# vao = datetime.strptime("2025-08-23 07:10:00", "%Y-%m-%d %H:%M:%S")
# ra = datetime.strptime("2025-08-23 16:45:00", "%Y-%m-%d %H:%M:%S")

# tre, som = tinh_tre_som(vao, ra)
# print(f"Đi trễ: {tre} phút, Về sớm: {som} phút")
from datetime import datetime, date, timedelta
import calendar
import random

thang = 4
nam = 2026
nhan_vien_id = 1

ngay_dau_thang = date(nam, thang, 1)
so_ngay_trong_thang = calendar.monthrange(nam, thang)[1]

values = []
for i in range(so_ngay_trong_thang):
    ngay = ngay_dau_thang + timedelta(days=i)
    if ngay.weekday() < 5:  # chỉ lấy thứ 2 - thứ 6
        gio_vao_gio = 7 if random.random() < 0.5 else 8
        gio_vao_phut = random.randint(30, 59) if gio_vao_gio == 7 else random.randint(0, 5)
        thoi_gian_vao = datetime(nam, thang, ngay.day, gio_vao_gio, gio_vao_phut)

        gio_ra = 17  # chỉ trong giờ 17h
        phut_ra = random.randint(0, 59)
        thoi_gian_ra = datetime(nam, thang, ngay.day, gio_ra, phut_ra)

        values.append(
            f"({nhan_vien_id}, '{thoi_gian_vao}', '{thoi_gian_ra}', '{ngay}', NULL, NULL)"
        )

sql = "INSERT INTO cham_cong (nhan_vien_id, thoi_gian_vao, thoi_gian_ra, ngay, hinh_anh_vao, hinh_anh_ra) VALUES\n"
sql += ",\n".join(values) + ";"

print(sql)
