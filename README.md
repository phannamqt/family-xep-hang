# Xếp Hàng — Hệ Thống Quản Lý Hàng Đợi Thông Minh

Phần mềm quản lý hàng đợi khám bệnh cho phòng khám/bệnh viện. Ưu tiên bệnh nhân dựa trên công thức điểm đa thành phần, cập nhật realtime qua Socket.io.

---

## Mục lục

- [Đề bài & Yêu cầu nghiệp vụ](#1-đề-bài--yêu-cầu-nghiệp-vụ)
- [Công thức tính điểm](#2-công-thức-tính-điểm)
- [Luồng nghiệp vụ](#3-luồng-nghiệp-vụ)
- [Tech Stack](#4-tech-stack)
- [Cấu trúc dự án](#5-cấu-trúc-dự-án)
- [Cài đặt & Chạy local](#6-cài-đặt--chạy-local)
- [Deploy production](#7-deploy-production)
- [API Reference](#8-api-reference)
- [Cấu hình hệ thống](#9-cấu-hình-hệ-thống)

---

## 1. Đề bài & Yêu cầu nghiệp vụ

### Bối cảnh

Phòng khám có nhiều phòng khám song song (mỗi phòng có thể có nhiều bác sĩ/slot). Bệnh nhân đến không theo thứ tự cố định — một số có giờ hẹn, một số không; một số thuộc đối tượng ưu tiên (cấp cứu, VIP, cao tuổi, trẻ em...). Hệ thống cần xếp hàng tự động, công bằng, có thể can thiệp thủ công.

### Yêu cầu chức năng

#### F1 — Quản lý bệnh nhân
- Thêm/sửa/xóa hồ sơ bệnh nhân (họ tên, ngày sinh, giới tính, số điện thoại, CCCD, địa chỉ)
- Tìm kiếm theo tên, số điện thoại, CCCD

#### F2 — Tạo lượt khám
- Tạo lượt khám cho bệnh nhân đã có hồ sơ
- Chọn **nhiều đối tượng ưu tiên** cùng lúc (ví dụ: vừa cao tuổi ≥70, vừa VIP)
- Điểm ưu tiên P = tổng scoreP của tất cả đối tượng được chọn
- Có thể đặt giờ hẹn (tùy chọn)
- Hệ thống tự sinh mã lượt khám duy nhất (định dạng: `VK-YYYYMMDD-###`)
- Bệnh nhân mang mã này đến phòng khám để check-in

#### F3 — Check-in
- Lễ tân/điều dưỡng nhập mã lượt khám
- Chọn phòng khám bệnh nhân sẽ vào
- Chọn loại: **Khám mới** hoặc **Trả kết quả**
- Sau check-in: bệnh nhân tự động vào hàng đợi của phòng đó

#### F4 — Màn hình xếp hàng (3 cột realtime)
- **Chờ khám**: Danh sách bệnh nhân đang chờ, sắp xếp theo điểm tổng (cao → thấp)
  - Hiển thị điểm từng thành phần khi hover
  - Điểm tự động tăng theo thời gian (mỗi phút)
  - Check-in nhanh ngay trên màn hình này
- **Đang khám**: Bệnh nhân đang trong phòng, theo từng slot bác sĩ
- **Đã khám xong**: Danh sách hoàn tất trong ngày

#### F5 — Điều phối hàng đợi (bác sĩ/điều dưỡng)
- **Mời vào phòng**: Chọn bệnh nhân → chọn slot bác sĩ → bệnh nhân chuyển sang "Đang khám"
- **Bỏ qua (Skip thủ công)**: Bệnh nhân chưa sẵn sàng → cộng điểm S bù đắp để không bị thiệt
- **Khám xong**: Kết thúc ca khám → bệnh nhân chuyển sang "Đã xong"
- **Điều chỉnh F**: Bác sĩ có thể cộng/trừ điểm thủ công cho trường hợp đặc biệt

#### F6 — Quản lý phòng & bác sĩ
- Tạo/sửa/xóa phòng khám (phòng khám / phòng trả kết quả)
- Cấu hình số slot bác sĩ trong mỗi phòng
- Ghi tên bác sĩ theo từng slot
- Đánh dấu bác sĩ vắng (slot đó sẽ không xuất hiện khi mời bệnh nhân)

#### F7 — Cấu hình hệ thống
- Thêm/sửa/xóa danh mục đối tượng ưu tiên và điểm P tương ứng
- Điều chỉnh các hệ số tính điểm (T, S, C)

---

## 2. Công thức tính điểm

### Tổng điểm

```
Score = P + T(t) + S + C + F
```

### Từng thành phần

| Thành phần | Tên | Công thức | Mô tả |
|-----------|-----|-----------|-------|
| **P** | Ưu tiên nền | `Σ scoreP của các đối tượng được chọn` | Cố định từ lúc check-in. Cấp cứu=1000, VIP=120, DVCC=60... |
| **T(t)** | Thời gian chờ | `t + α × t²` (α = 0.04) | Tăng theo bậc 2 — càng chờ lâu càng được ưu tiên hơn |
| **S** | Bù đắp skip | Cộng dồn khi bị bỏ qua | Skip thủ công: +20/+40/+60 lần lượt. Bị đẩy lùi tự động: +5/lần |
| **C** | Check-in đúng giờ | `t_chờ × 1 − t_trễ × 1` | Cộng theo phút chờ, trừ nếu đến trễ hơn giờ hẹn |
| **F** | Công bằng thủ công | Nhập tay | Bác sĩ/điều dưỡng điều chỉnh cho trường hợp đặc biệt |

### Ví dụ tính điểm T(t)

| Thời gian chờ | T(t) = t + 0.04t² |
|--------------|-------------------|
| 5 phút | 5 + 0.04×25 = **6.0** |
| 10 phút | 10 + 0.04×100 = **14.0** |
| 20 phút | 20 + 0.04×400 = **36.0** |
| 30 phút | 30 + 0.04×900 = **66.0** |

> Hệ số α tăng tốc độ tăng điểm theo thời gian, đảm bảo bệnh nhân chờ lâu sẽ được phục vụ.

### Danh mục ưu tiên mặc định

| Đối tượng | Điểm P | Thứ tự |
|-----------|--------|--------|
| Cấp cứu | 1000 | 1 |
| VIP | 120 | 2 |
| Dịch vụ cao cấp (DVCC) | 60 | 3 |
| KH chiến lược (IVF, Quảng Ngãi...) | 30 | 4 |
| Người cao tuổi ≥ 70 | 20 | 5 |
| Người cao tuổi 60–69 | 10 | 6 |
| Trẻ em < 6 tuổi (có sốt/mệt) | 15 | 7 |
| Trẻ em < 6 tuổi | 5 | 8 |
| Bệnh nhân thường | 0 | 9 |

> Bệnh nhân có thể thuộc **nhiều đối tượng cùng lúc** — điểm P được cộng dồn.

---

## 3. Luồng nghiệp vụ

```
[Tạo lượt khám]
    Lễ tân tạo lượt → chọn bệnh nhân + đối tượng ưu tiên
    → Hệ thống sinh mã VK-YYYYMMDD-###
    → Bệnh nhân nhận mã

[Check-in]
    Bệnh nhân đến → lễ tân nhập mã + chọn phòng + loại khám
    → Vào hàng đợi với điểm ban đầu = P + C₀

[Hàng đợi — tự động mỗi phút]
    Scheduler chạy mỗi phút
    → Tính lại T(t) cho tất cả bệnh nhân đang chờ
    → Sắp xếp lại theo tổng điểm
    → Nếu bệnh nhân bị đẩy lùi thứ hạng → cộng thêm S tự động
    → Đẩy cập nhật realtime qua Socket.io

[Điều phối]
    Bác sĩ sẵn sàng → chọn bệnh nhân đầu hàng → "Mời vào phòng"
    → Chọn slot bác sĩ → bệnh nhân chuyển "Đang khám"
    → Khám xong → bấm "Khám xong" → chuyển "Đã xong"
    → Mỗi action đều emit socket update ngay lập tức
```

---

## 4. Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | NestJS, TypeORM, PostgreSQL |
| Realtime | Socket.io |
| Scheduler | @nestjs/schedule (cron mỗi phút) |
| Frontend | React 18, TypeScript, Vite |
| State | TanStack Query (React Query) |
| Styling | Tailwind CSS v4 |
| Build | Docker multi-stage |
| CI/CD | GitHub Actions → Docker Hub → SSH deploy |

---

## 5. Cấu trúc dự án

```
xep-hang/
├── backend/
│   └── src/
│       ├── config/          # Danh mục ưu tiên & cấu hình điểm
│       ├── patients/        # Quản lý bệnh nhân
│       ├── visits/          # Lượt khám & check-in
│       ├── rooms/           # Phòng khám & slot bác sĩ
│       └── queue/           # Hàng đợi, tính điểm, socket, scheduler
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── queue/       # Màn hình xếp hàng 3 cột
│       │   ├── visits/      # Lượt khám & check-in
│       │   ├── patients/    # Danh sách bệnh nhân
│       │   └── config/      # Cấu hình hệ thống
│       ├── hooks/           # useQueueSocket
│       ├── api/             # Axios API client
│       └── types/           # TypeScript interfaces
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Production deployment
└── .github/workflows/       # CI/CD pipeline
```

---

## 6. Cài đặt & Chạy local

### Yêu cầu

- Node.js 20+
- PostgreSQL 14+

### Bước 1: Clone & tạo `.env`

```bash
git clone <repo>
cd xep-hang
cp .env.example .env
```

Chỉnh `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_xep_hang
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
PORT=3000
```

### Bước 2: Chạy Backend

```bash
cd backend
npm install --legacy-peer-deps
npm run start:dev
```

Backend chạy tại `http://localhost:3000`
Database tự động sync schema khi khởi động lần đầu (TypeORM `synchronize: true`).
Dữ liệu mặc định (danh mục ưu tiên, cấu hình điểm) được seed tự động.

### Bước 3: Chạy Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend chạy tại `http://localhost:5173`, tự động proxy `/api` → `http://localhost:3000`.

---

## 7. Deploy production

### Yêu cầu server

- Docker & Docker Compose
- Nginx (reverse proxy)
- Cloudflare (HTTPS termination)

### Cấu hình GitHub Secrets

| Secret | Giá trị |
|--------|---------|
| `DOCKER_USERNAME` | Tài khoản Docker Hub |
| `DOCKER_PASSWORD` | Password Docker Hub |
| `SSH_HOST` | IP hoặc domain server |
| `SSH_USERNAME` | User SSH (vd: `root`) |
| `SSH_PRIVATE_KEY` | Nội dung file private key (`~/.ssh/id_rsa`) |
| `DB_HOST` | Host PostgreSQL |
| `DB_USERNAME` | DB username |
| `DB_PASSWORD` | DB password |
| `DB_NAME` | Tên database |
| `JWT_SECRET` | JWT secret key |

### CI/CD Pipeline

Push code lên `master` → tự động:

1. Build Docker image (frontend + backend trong 1 container)
2. Push lên Docker Hub: `phannamit/family-xep-hang:latest`
3. SSH vào server → pull image mới → restart container

### Cấu hình Nginx

```nginx
upstream family_xep_hang {
    server 103.75.180.92:3030 max_fails=2 fail_timeout=60;
}

server {
    listen 80;
    server_name family-xep-hang.phannam.com;

    location / {
        proxy_pass http://family_xep_hang;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;

        # Socket.io support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### Cấu hình Cloudflare

- Thêm DNS record: `family-xep-hang.phannam.com` → A → IP server → **Proxied**
- SSL mode: **Flexible**

### Deploy thủ công (nếu cần)

```bash
# Trên server
cd /opt/family-xep-hang

# Tạo .env
cat > .env << EOF
DB_HOST=db-master.phannam.com
DB_PORT=5432
DB_NAME=family_xep_hang
DB_USERNAME=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret
EOF

# Pull và chạy
docker pull phannamit/family-xep-hang:latest
docker compose up -d
```

---

## 8. API Reference

### Queue

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/queue?roomId=&date=` | Lấy danh sách hàng đợi theo phòng/ngày |
| POST | `/api/queue/invite` | Mời bệnh nhân vào phòng `{ queueEntryId, slotId }` |
| POST | `/api/queue/:id/done` | Kết thúc ca khám |
| POST | `/api/queue/:id/skip` | Bỏ qua thủ công |
| PATCH | `/api/queue/fairness` | Điều chỉnh điểm F `{ queueEntryId, scoreF }` |

### Visits

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/visits?date=` | Lấy danh sách lượt khám theo ngày |
| POST | `/api/visits` | Tạo lượt khám `{ patientId, categoryIds[], appointmentTime?, visitDate? }` |
| PATCH | `/api/visits/:id/categories` | Cập nhật đối tượng ưu tiên |
| POST | `/api/visits/checkin` | Check-in `{ visitCode, type, roomId }` |

### Patients

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/patients?search=` | Tìm kiếm bệnh nhân |
| POST | `/api/patients` | Tạo bệnh nhân |
| PATCH | `/api/patients/:id` | Cập nhật bệnh nhân |
| DELETE | `/api/patients/:id` | Xóa bệnh nhân |

### Rooms

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/rooms` | Danh sách phòng khám |
| POST | `/api/rooms` | Tạo phòng |
| POST | `/api/rooms/:id/slots` | Cấu hình số slot `{ count }` |
| PATCH | `/api/rooms/:roomId/slots/:slotId` | Cập nhật slot `{ doctorName, isAbsent }` |
| GET | `/api/rooms/:id/slots/available` | Slot đang trực (không vắng) |

### Config

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/config/categories` | Danh sách đối tượng ưu tiên |
| POST | `/api/config/categories` | Tạo đối tượng |
| PATCH | `/api/config/categories/:id` | Cập nhật đối tượng |
| DELETE | `/api/config/categories/:id` | Xóa đối tượng |
| GET | `/api/config/score-settings` | Cấu hình điểm |
| PATCH | `/api/config/score-settings` | Cập nhật cấu hình điểm |

### Socket.io Events

| Event | Chiều | Payload | Mô tả |
|-------|-------|---------|-------|
| `join-queue` | Client → Server | `{ roomId, date? }` | Đăng ký nhận update của phòng |
| `leave-queue` | Client → Server | `{ roomId, date? }` | Hủy đăng ký |
| `queue:updated` | Server → Client | `QueueEntry[]` | Danh sách hàng đợi mới nhất |

---

## 9. Cấu hình hệ thống

Truy cập trang **Cấu hình** trong app để điều chỉnh:

### Hệ số điểm (ScoreConfig)

| Tham số | Mặc định | Mô tả |
|---------|---------|-------|
| `timeCoefficient` | `0.04` | Hệ số α trong T(t) = t + α×t² |
| `skipScores` | `[20, 40, 60]` | Điểm S bù khi bị skip thủ công lần 1/2/3+ |
| `autoSkipScore` | `5` | Điểm S bù mỗi lần bị đẩy lùi tự động |
| `waitingScorePerMinute` | `1` | Điểm C cộng mỗi phút chờ |
| `lateDeductionPerMinute` | `1` | Điểm C trừ mỗi phút đến trễ hơn giờ hẹn |

### Đối tượng ưu tiên

Có thể thêm/sửa/xóa các đối tượng và điểm P tương ứng qua giao diện **Cấu hình → Danh mục đối tượng**.
