# Hướng Dẫn Sử Dụng — Phần Mềm Xếp Hàng Thông Minh

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Các màn hình chính](#2-các-màn-hình-chính)
3. [Quy trình sử dụng hàng ngày](#3-quy-trình-sử-dụng-hàng-ngày)
4. [Hướng dẫn từng bước](#4-hướng-dẫn-từng-bước)
   - [Thêm bệnh nhân mới](#41-thêm-bệnh-nhân-mới)
   - [Tạo lượt khám](#42-tạo-lượt-khám)
   - [Check-in bệnh nhân](#43-check-in-bệnh-nhân)
   - [Điều phối hàng đợi](#44-điều-phối-hàng-đợi)
   - [Cấu hình hệ thống](#45-cấu-hình-hệ-thống)
5. [Giải thích điểm số](#5-giải-thích-điểm-số)
6. [Câu hỏi thường gặp](#6-câu-hỏi-thường-gặp)

---

## 1. Tổng quan

Phần mềm giúp quản lý hàng đợi bệnh nhân tại phòng khám một cách **tự động và công bằng**. Thay vì xếp hàng theo thứ tự đến trước — về trước đơn thuần, hệ thống tính điểm cho mỗi bệnh nhân dựa trên nhiều yếu tố: đối tượng ưu tiên, thời gian chờ, lần bị bỏ qua... để đưa ra thứ tự hợp lý nhất.

**Ai dùng phần mềm này?**

| Vai trò | Nhiệm vụ |
|---------|----------|
| **Lễ tân / Hành chính** | Tạo hồ sơ bệnh nhân, tạo lượt khám, in/đưa mã cho bệnh nhân |
| **Điều dưỡng / Bàn check-in** | Check-in bệnh nhân khi họ đến, chọn phòng khám |
| **Bác sĩ / Điều dưỡng phòng khám** | Mời bệnh nhân vào, bỏ qua, đánh dấu xong |

---

## 2. Các màn hình chính

```
📌 Menu bên trái (hoặc ☰ trên điện thoại):

🏥 Danh sách xếp hàng   — Màn hình chính, xem hàng đợi theo phòng khám
✅ Check-in              — Nhập mã lượt khám để check-in
📋 Lượt khám             — Tạo và quản lý lượt khám trong ngày
👤 Bệnh nhân             — Quản lý hồ sơ bệnh nhân
⚙️ Cấu hình             — Cài đặt hệ thống (quản lý dùng)
```

---

## 3. Quy trình sử dụng hàng ngày

```
BƯỚC 1 — Lễ tân tạo lượt khám
  └─ Bệnh nhân đến → tìm hồ sơ (hoặc tạo mới)
  └─ Tạo lượt khám → chọn đối tượng ưu tiên
  └─ Hệ thống sinh mã (VK-YYYYMMDD-###) → đưa mã cho bệnh nhân

BƯỚC 2 — Điều dưỡng check-in
  └─ Bệnh nhân nộp mã → nhập vào màn hình Check-in
  └─ Chọn phòng khám → chọn loại (Khám mới / Trả kết quả)
  └─ Bệnh nhân tự động vào hàng đợi của phòng đó

BƯỚC 3 — Bác sĩ điều phối
  └─ Mở màn hình Xếp hàng → chọn phòng của mình
  └─ Bệnh nhân đứng đầu hàng → bấm "Mời vào ►"
  └─ Chọn slot bác sĩ → bệnh nhân chuyển sang "Đang khám"
  └─ Khám xong → bấm "✓ Khám xong"
```

> **Lưu ý:** 1 bệnh nhân có thể check-in nhiều phòng khác nhau trong cùng 1 lượt khám (ví dụ: khám Lâm sàng xong → check-in Xét nghiệm → check-in Siêu âm).

---

## 4. Hướng dẫn từng bước

### 4.1 Thêm bệnh nhân mới

> Thực hiện khi bệnh nhân đến lần đầu, chưa có hồ sơ trong hệ thống.

1. Vào menu **👤 Bệnh nhân**
2. Bấm nút **+ Thêm** (góc phải trên)
3. Điền thông tin:
   - **Họ và tên** *(bắt buộc)*
   - **Ngày sinh** *(bắt buộc)*
   - **Giới tính**
   - Số điện thoại, CCCD, địa chỉ *(tùy chọn)*
4. Bấm **Thêm** để lưu

> **Mẹo:** Lần sau tìm bệnh nhân bằng ô tìm kiếm — gõ tên, số điện thoại hoặc số CCCD.

---

### 4.2 Tạo lượt khám

> Thực hiện mỗi lần bệnh nhân đến khám (kể cả bệnh nhân cũ).

1. Vào menu **📋 Lượt khám**
2. Bấm **+ Tạo** (góc phải trên)
3. Chọn **bệnh nhân** từ danh sách
4. Chọn **đối tượng ưu tiên** — có thể chọn nhiều cùng lúc:

   | Đối tượng | Điểm ưu tiên |
   |-----------|-------------|
   | Cấp cứu | 1000 |
   | VIP | 120 |
   | Dịch vụ cao cấp (DVCC) | 60 |
   | KH chiến lược | 30 |
   | Cao tuổi ≥ 70 | 20 |
   | Cao tuổi 60–69 | 10 |
   | Trẻ em < 6 tuổi (sốt/mệt) | 15 |
   | Trẻ em < 6 tuổi | 5 |
   | Bệnh nhân thường | 0 |

   > Nếu bệnh nhân vừa cao tuổi vừa VIP → chọn cả hai, điểm được cộng dồn.

5. Đặt **giờ hẹn** nếu có lịch hẹn trước *(tùy chọn)*
6. Bấm **Tạo lượt khám**
7. Hệ thống sinh ra **mã lượt khám** (ví dụ: `VK-20260406-003`)
8. **Bấm "Copy mã"** → đưa cho bệnh nhân (in hoặc ghi tay)

#### Sửa lượt khám

Khi cần điều chỉnh thông tin sau khi đã tạo (ví dụ: bệnh nhân có thêm đối tượng ưu tiên, hoặc đổi giờ hẹn):

1. Vào menu **📋 Lượt khám** → chọn đúng ngày
2. Bấm **Sửa** trên dòng/thẻ lượt khám cần chỉnh
3. Điều chỉnh **đối tượng ưu tiên** và/hoặc **giờ hẹn**
4. Bấm **Cập nhật**

> **Quan trọng:** Nếu bệnh nhân đã check-in và đang trong hàng đợi, thay đổi đối tượng ưu tiên sẽ **tính lại điểm và cập nhật thứ tự hàng đợi ngay lập tức** ở tất cả phòng bệnh nhân đang chờ — không cần đợi.

---

### 4.3 Check-in bệnh nhân

> Thực hiện khi bệnh nhân đến quầy/phòng khám và nộp mã lượt khám.

**Cách 1 — Trang Check-in riêng** (dành cho bàn lễ tân):

1. Vào menu **✅ Check-in**
2. Nhập **mã lượt khám** (ví dụ: `VK-20260406-003`)
3. Chọn **Phòng khám** bệnh nhân sẽ vào
4. Chọn loại:
   - **Khám mới** — bệnh nhân đến khám lần đầu trong ngày
   - **Trả kết quả** — bệnh nhân quay lại nhận kết quả xét nghiệm/siêu âm
5. Bấm **Check-in**

**Cách 2 — Check-in nhanh ngay trên màn hình Xếp hàng** (dành cho điều dưỡng phòng):

1. Vào **🏥 Danh sách xếp hàng** → chọn phòng
2. Nhập mã vào ô **"Mã lượt khám..."** ở đầu cột Chờ khám
3. Chọn loại → bấm **Check-in** (hoặc Enter)

> **Lưu ý:** 1 lượt khám có thể check-in vào **nhiều phòng khác nhau**. Ví dụ: check-in Phòng Lâm sàng trước, khám xong → check-in Phòng Xét nghiệm tiếp theo.

---

### 4.4 Điều phối hàng đợi

> Màn hình chính dành cho bác sĩ và điều dưỡng tại phòng khám.

1. Vào menu **🏥 Danh sách xếp hàng**
2. **Chọn phòng khám** từ dropdown (góc trái trên)
3. Chọn **ngày** (mặc định hôm nay)

Màn hình chia 3 cột:

#### Cột 1 — Chờ khám
Danh sách bệnh nhân đang đợi, **sắp xếp từ điểm cao xuống thấp** (ưu tiên nhất ở trên).

Mỗi thẻ bệnh nhân có:
- **Số thứ tự** (vòng tròn xanh)
- Tên bệnh nhân + số phút đã chờ
- **Điểm tổng** — hover/nhấn để xem chi tiết từng thành phần
- **F:** — ô nhập điểm thủ công (xem bên dưới)
- Nút **Bỏ qua** — bệnh nhân chưa sẵn sàng, tạm bỏ qua (vẫn ở trong hàng, được cộng điểm bù)
- Nút **Mời vào ►** — gọi bệnh nhân vào phòng

**Để mời bệnh nhân vào phòng:**
1. Bấm **Mời vào ►** trên thẻ bệnh nhân
2. Chọn **slot bác sĩ** (Slot 1, Slot 2...) — chỉ hiện slot bác sĩ đang trực
3. Bệnh nhân chuyển sang cột **Đang khám**

**Điều chỉnh điểm F (Fairness):**
- Nhập số vào ô **F:** rồi Enter hoặc click ra ngoài
- Số dương → tăng ưu tiên, số âm → giảm ưu tiên
- Dùng cho các trường hợp đặc biệt mà hệ thống chưa tính được

#### Cột 2 — Đang khám
Hiển thị từng **slot bác sĩ** và bệnh nhân đang được khám.

- Slot có bác sĩ vắng → hiển thị **"Vắng"** (đỏ), không xuất hiện khi mời
- Bấm **✓ Khám xong** khi hoàn tất → bệnh nhân chuyển sang cột Đã xong

#### Cột 3 — Đã khám xong
Danh sách bệnh nhân đã hoàn tất trong ngày, sắp xếp từ mới nhất.

> **Trên điện thoại:** Ba cột hiển thị dạng **3 tab** — bấm để chuyển giữa Chờ / Đang khám / Xong.

---

### 4.5 Cấu hình hệ thống

> Dành cho quản lý — thiết lập một lần, không cần thay đổi thường xuyên.

Vào menu **⚙️ Cấu hình**, có 3 tab:

#### Tab 1 — Danh mục đối tượng
Quản lý các nhóm ưu tiên và điểm P tương ứng.
- **Thêm** đối tượng mới, **Sửa** điểm, **Xoá** nếu không dùng
- Thứ tự sắp xếp ảnh hưởng đến hiển thị khi tạo lượt khám

#### Tab 2 — Hệ số điểm
Điều chỉnh các tham số tính điểm:

| Tham số | Ý nghĩa | Gợi ý |
|---------|---------|-------|
| **Hệ số T(t)** | Tốc độ tăng điểm theo thời gian. Tăng → người chờ lâu được ưu tiên mạnh hơn | Giữ 0.04 |
| **Điểm S lỡ lượt** | Điểm bù khi bị bỏ qua thủ công lần 1/2/3 | 20, 40, 60 |
| **Điểm S tự động** | Điểm bù mỗi lần bị đẩy lùi hạng | 5 |
| **C: cộng mỗi phút chờ** | Điểm cộng thêm theo thời gian chờ tuyến tính | 1 |
| **C: trừ đến trễ hẹn** | Trừ điểm nếu bệnh nhân có lịch hẹn mà đến trễ | 1 |

#### Tab 3 — Phòng khám & Bác sĩ
Thiết lập phòng khám và danh sách bác sĩ/slot:

1. **Thêm phòng:** nhập tên → chọn loại (Phòng khám / Trả kết quả) → bấm Thêm
2. **Cấu hình slot:** chọn phòng → đặt số slot → bấm **Áp dụng**
3. **Nhập tên bác sĩ:** gõ vào ô tên bác sĩ của từng slot → tự động lưu khi click ra ngoài
4. **Đánh dấu vắng:** tick ô **Vắng** khi bác sĩ không trực — slot đó sẽ không hiện khi mời bệnh nhân

---

## 5. Giải thích điểm số

Khi hover vào điểm số của bệnh nhân, sẽ thấy bảng chi tiết:

```
Nguyễn Văn A
─────────────────────────────
P (Điểm theo đối tượng):  +130.0
   VIP                     +120
   Cao tuổi 60–69           +10
T (15ph):                  +23.4    ← Điểm thời gian chờ, tăng mỗi phút
S (skip/đẩy lùi):          +20.0    ← Điểm bù vì đã bị bỏ qua 1 lần
C (check-in):               +15.0    ← Đã chờ 15 phút kể từ check-in
F (thủ công):                +0.0    ← Chưa điều chỉnh
─────────────────────────────
TỔNG:                       188.4
```

> Điểm **P** được liệt kê chi tiết từng danh mục ưu tiên kèm điểm riêng, giúp kiểm tra nhanh bệnh nhân đã được chọn đúng đối tượng chưa.

**Điểm càng cao → đứng càng trên trong hàng đợi.**

Hệ thống tự tính lại **mỗi phút** và cập nhật thứ tự tức thì.

---

## 6. Câu hỏi thường gặp

**Q: Bệnh nhân bị bỏ qua có mất lượt không?**
> Không. Khi bấm "Bỏ qua", bệnh nhân vẫn ở trong hàng đợi và được **cộng thêm điểm bù** (lần 1: +20, lần 2: +40...) để không bị đẩy xuống mãi.

**Q: Bệnh nhân cấp cứu có luôn đứng đầu không?**
> Có. Điểm P của Cấp cứu là 1000 — cao hơn rất nhiều so với các đối tượng khác, nên sẽ luôn đứng đầu ngay khi check-in.

**Q: Có thể xem hàng đợi của nhiều phòng cùng lúc không?**
> Mở nhiều tab trình duyệt, mỗi tab chọn một phòng khác nhau. Tất cả đều cập nhật realtime.

**Q: Bệnh nhân khám LS xong, muốn đi xét nghiệm thì làm gì?**
> Check-in lại với **cùng mã lượt khám**, chọn **Phòng Xét nghiệm**. Bệnh nhân sẽ vào hàng đợi của phòng xét nghiệm với điểm tính từ đầu.

**Q: Lỡ check-in nhầm phòng thì sao?**
> Hiện tại cần liên hệ quản lý để can thiệp. Tính năng huỷ check-in đang được phát triển.

**Q: Bệnh nhân được phát hiện thêm đối tượng ưu tiên sau khi đã vào hàng đợi thì làm gì?**
> Vào **📋 Lượt khám** → bấm **Sửa** → tick thêm đối tượng → bấm **Cập nhật**. Hệ thống sẽ tính lại điểm và cập nhật thứ tự hàng đợi ở tất cả phòng ngay lập tức.

**Q: Thông báo thành công/thất bại hiện ở đâu?**
> Hiện ở góc dưới bên phải màn hình — màu xanh lá là thành công, màu đỏ là lỗi kèm lý do cụ thể. Thông báo tự tắt sau vài giây.

**Q: Màn hình xếp hàng có cần refresh không?**
> Không cần. Màn hình tự cập nhật realtime khi có thay đổi (● Realtime — chấm xanh góc phải).

**Q: Điện thoại dùng được không?**
> Được. Truy cập cùng địa chỉ web, giao diện tự điều chỉnh cho màn hình nhỏ. Menu ở nút ☰ góc trái trên.
