# AI BANK MARKETING – CUSTOMER CLASSIFICATION SYSTEM

Hệ thống ứng dụng thuật toán **Decision Tree** để phân loại và dự đoán khả năng khách hàng đăng ký sản phẩm tiền gửi có kỳ hạn (Term Deposit), hỗ trợ ra quyết định tiếp thị ngân hàng số (Marketing Decision Support System).

---

## 1. GIỚI THIỆU DỰ ÁN

- **Mục tiêu**: Dự đoán khả năng khách hàng đăng ký tiền gửi có kỳ hạn với 2 nhãn phân loại:
  - **YES**: Khách hàng có khả năng đăng ký tiền gửi có kỳ hạn.
  - **NO**: Khách hàng không có khả năng đăng ký tiền gửi có kỳ hạn.
- **Tập dữ liệu**: `bank.csv` (11.162 bản ghi, 17 biến: 7 numerical + 9 categorical + 1 target `deposit`).
- **Thuật toán Machine Learning**: Decision Tree Classifier (Gini Impurity, Information Gain, predict_proba).
- **Độ chính xác mô hình**:
  - Accuracy: **80.12%**
  - Precision (YES): **78.37%**
  - Recall (YES): **80.15%**
  - F1-Score (YES): **79.25%**
  - Đánh giá trên 2.233 mẫu tập kiểm thử độc lập (20% Stratified test set).

---

## 2. KIẾN TRÚC HỆ THỐNG

### Frontend
- **React 19 & TypeScript**: Xây dựng SPA hiện đại, phân tách component rõ ràng.
- **Tailwind CSS**: Thiết kế giao diện Digital Banking chuyên nghiệp (Navy Blue `#102A43`, Blue `#2563EB`, Background `#F5F7FB`).
- **Recharts**: 7 biểu đồ phân tích trực quan (Pie chart YES/NO, xu hướng thời gian, phân bố nghề nghiệp, nhóm tuổi, vay nợ, Confidence distribution).
- **Lucide Icons**: Bộ icon tinh giản, nhất quán.

### Backend
- **Express.js & TypeScript**: RESTful API an toàn, xử lý xác thực Token/JWT, kiểm tra dữ liệu đầu vào.
- **Python FastAPI** (tùy chọn triển khai microservice): Đầy đủ script trong thư mục `python_ml/`.
- **Database**: Bảng `users`, `customers`, `predictions`, `model_registry`, `audit_logs`, `settings`.

### Machine Learning Engine
- Tiền xử lý dữ liệu chuẩn hóa (Numerical features + One-Hot Encoding Categorical features).
- Quyết định rẽ nhánh theo toán học Decision Tree, tính toán xác suất `predict_proba` tại nút lá: `P(YES) + P(NO) = 100%`.
- Lưu trữ mô hình: `data/decision_tree_bank_model.json` và `decision_tree_bank_model.joblib`.

---

## 3. TÀI KHOẢN TRUY CẬP VÀ PHÂN QUYỀN (RBAC)

Hệ thống có sẵn tính năng **"Thử nghiệm quyền" (1-Click)** trên thanh tiêu đề để chuyển đổi tức thì giữa các vai trò:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **ADMIN** | `admin` | `Admin@Bank2026` | Toàn quyền: Quản lý tài khoản người dùng, xem toàn bộ lịch sử, quản lý và huấn luyện lại mô hình AI, xem nhật ký kiểm toán (Audit Logs), cấu hình ngưỡng hệ thống. |
| **STAFF** | `staff01` | `Staff@Bank2026` | Quản lý khách hàng, thực hiện dự đoán hồ sơ mới, xem lịch sử dự đoán của mình, xem dashboard tiếp thị. |
| **STAFF 2** | `staff02` | `Staff@Bank2026` | Nhân viên tư vấn tiếp thị. |

---

## 4. 3 HỒ SƠ KHÁCH HÀNG MẪU (TEST PROFILES)

Hệ thống tích hợp sẵn 3 nút chọn nhanh hồ sơ mẫu tại màn hình **Dự đoán khách hàng**:

1. **Hồ sơ 1 (Khách hàng tiềm năng)**:
   - 35 tuổi, Quản lý (management), Đã kết hôn, Đại học (tertiary), Không nợ quá hạn, Số dư $2500, Không vay nhà/cá nhân, Cuộc gọi 450 giây, Tháng 8.
   - **Kết quả mô hình**: Dự đoán **YES** (Xác suất YES ~80.48%).

2. **Hồ sơ 2 (Cần đánh giá thêm)**:
   - 45 tuổi, Kỹ thuật (technician), Đã kết hôn, Trung học (secondary), Số dư $500, Có vay mua nhà, Cuộc gọi 180 giây, Tháng 6.
   - **Kết quả mô hình**: Dự đoán **NO** (Xác suất NO ~90.23%).

3. **Hồ sơ 3 (Khách hàng có lịch sử tiếp thị trước đó)**:
   - 58 tuổi, Hưu trí (retired), Ly hôn, Trung học (secondary), Số dư $4200, Không vay nợ, Cuộc gọi 600 giây, Tháng 3, Chiến dịch trước thành công (poutcome: success).
   - **Kết quả mô hình**: Dự đoán **YES** (Xác suất YES ~97.27%).

---

## 5. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Chạy ứng dụng Full-Stack (Node.js & Express):
```bash
# 1. Cài đặt dependencies
npm install

# 2. Huấn luyện và tạo mô hình Decision Tree ban đầu
npx tsx server/ml/train.ts

# 3. Khởi động máy chủ phát triển
npm run dev
```
Truy cập: `http://localhost:3000`

### Chạy bằng Docker & Docker Compose:
```bash
docker-compose up --build
```

### Chạy kịch bản Scikit-learn Python độc lập:
```bash
# Cài đặt thư viện Python
pip install -r requirements.txt

# Huấn luyện mô hình và lưu Joblib
python python_ml/train_decision_tree.py

# Khởi chạy FastAPI
python python_ml/main_fastapi.py
```

---

## 6. BẢO MẬT & KIỂM TOÁN
- Mật khẩu được mã hóa an toàn (PBKDF2/SHA256).
- Mọi hoạt động đăng nhập, dự đoán, chỉnh sửa hồ sơ và huấn luyện lại mô hình đều được tự động lưu vào **Audit Logs**.
- Kiểm tra tính hợp lệ dữ liệu (Input Validation) nghiêm ngặt trước khi đưa vào mô hình suy luận.
