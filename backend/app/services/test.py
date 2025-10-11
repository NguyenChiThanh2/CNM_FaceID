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





# sinh sữ liệu 1 nhân viên
# ====================================================================
# from datetime import datetime, date, timedelta
# import calendar
# import random

# thang = 4
# nam = 2025
# nhan_vien_id = 5

# ngay_dau_thang = date(nam, thang, 1)
# so_ngay_trong_thang = calendar.monthrange(nam, thang)[1]

# values = []
# for i in range(so_ngay_trong_thang):
#     ngay = ngay_dau_thang + timedelta(days=i)
#     if ngay.weekday() < 5:  # chỉ lấy thứ 2 - thứ 6
#         gio_vao_gio = 7 if random.random() < 0.5 else 8
#         gio_vao_phut = random.randint(30, 59) if gio_vao_gio == 7 else random.randint(0, 5)
#         thoi_gian_vao = datetime(nam, thang, ngay.day, gio_vao_gio, gio_vao_phut)

#         gio_ra = 17  # chỉ trong giờ 17h
#         phut_ra = random.randint(0, 59)
#         thoi_gian_ra = datetime(nam, thang, ngay.day, gio_ra, phut_ra)

#         values.append(
#             f"({nhan_vien_id}, '{thoi_gian_vao}', '{thoi_gian_ra}', '{ngay}', NULL, NULL)"
#         )

# sql = "INSERT INTO cham_cong (nhan_vien_id, thoi_gian_vao, thoi_gian_ra, ngay, hinh_anh_vao, hinh_anh_ra) VALUES\n"
# sql += ",\n".join(values) + ";"

# print(sql)


from datetime import datetime, date, timedelta
import calendar
import random

def generate_cham_cong_data(start_nhan_vien_id, end_nhan_vien_id, thang, nam):
    """
    Tạo dữ liệu chấm công cho nhiều nhân viên trong khoảng ID chỉ định
    
    Args:
        start_nhan_vien_id (int): ID nhân viên bắt đầu
        end_nhan_vien_id (int): ID nhân viên kết thúc
        thang (int): Tháng cần tạo dữ liệu
        nam (int): Năm cần tạo dữ liệu
    """
    
    ngay_dau_thang = date(nam, thang, 1)
    so_ngay_trong_thang = calendar.monthrange(nam, thang)[1]
    
    all_values = []
    
    # Duyệt qua từng nhân viên trong khoảng ID
    for nhan_vien_id in range(start_nhan_vien_id, end_nhan_vien_id + 1):
        nhan_vien_values = []
        
        for i in range(so_ngay_trong_thang):
            ngay = ngay_dau_thang + timedelta(days=i)
            
            # Chỉ tạo dữ liệu cho ngày làm việc (thứ 2 - thứ 6)
            if ngay.weekday() < 5:
                # Tạo thời gian vào ngẫu nhiên
                gio_vao_gio = 7 if random.random() < 0.5 else 8
                gio_vao_phut = random.randint(30, 59) if gio_vao_gio == 7 else random.randint(0, 5)
                thoi_gian_vao = datetime(nam, thang, ngay.day, gio_vao_gio, gio_vao_phut)

                # Tạo thời gian ra ngẫu nhiên
                gio_ra = 17  # chỉ trong giờ 17h
                phut_ra = random.randint(0, 59)
                thoi_gian_ra = datetime(nam, thang, ngay.day, gio_ra, phut_ra)

                nhan_vien_values.append(
                    f"({nhan_vien_id}, '{thoi_gian_vao}', '{thoi_gian_ra}', '{ngay}', NULL, NULL)"
                )
        
        all_values.extend(nhan_vien_values)
    
    # Tạo câu lệnh SQL
    if all_values:
        sql = "INSERT INTO cham_cong (nhan_vien_id, thoi_gian_vao, thoi_gian_ra, ngay, hinh_anh_vao, hinh_anh_ra) VALUES\n"
        sql += ",\n".join(all_values) + ";"
        return sql
    else:
        return "-- Không có dữ liệu để chèn"

# Ví dụ sử dụng:
if __name__ == "__main__":
    # Ví dụ 1: Tạo dữ liệu cho nhân viên từ 2 đến 30
    print("=== Dữ liệu cho nhân viên 2-30 ===")
    sql_1 = generate_cham_cong_data(4, 30, 4, 2025)
    print(sql_1)
    
    print("\n" + "="*50 + "\n")
    
    # # Ví dụ 2: Tạo dữ liệu cho nhân viên từ 5 đến 10
    # print("=== Dữ liệu cho nhân viên 5-10 ===")
    # sql_2 = generate_cham_cong_data(5, 10, 4, 2025)
    # print(sql_2)
    
    # print("\n" + "="*50 + "\n")
    
    # # Ví dụ 3: Tạo dữ liệu cho 1 nhân viên duy nhất
    # print("=== Dữ liệu cho nhân viên 15 ===")
    # sql_3 = generate_cham_cong_data(15, 15, 4, 2025)
    # print(sql_3)