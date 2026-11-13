"""
Backend API FastAPI cho AI Bank Marketing Customer Classification System.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn
from model_pipeline import BankDecisionTreePredictor

app = FastAPI(
    title="AI Bank Marketing - Customer Classification API",
    description="Hệ thống hỗ trợ ra quyết định tiếp thị ngân hàng sử dụng thuật toán Decision Tree",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = None

@app.on_event("startup")
def startup_event():
    global predictor
    try:
        predictor = BankDecisionTreePredictor()
    except Exception as e:
        print(f"Warning: Could not load joblib model on startup: {e}")

class CustomerDataSchema(BaseModel):
    age: int = Field(..., ge=18, le=110, description="Tuổi khách hàng (18 - 110)")
    job: str = Field(..., description="Nghề nghiệp")
    marital: str = Field(..., description="Tình trạng hôn nhân")
    education: str = Field(..., description="Trình độ học vấn")
    default: str = Field(..., description="Có nợ xấu hay không (yes/no)")
    balance: int = Field(..., description="Số dư tài khoản trung bình hàng năm")
    housing: str = Field(..., description="Có khoản vay mua nhà (yes/no)")
    loan: str = Field(..., description="Có khoản vay cá nhân (yes/no)")
    contact: str = Field(..., description="Hình thức liên hệ")
    day: int = Field(..., ge=1, le=31, description="Ngày liên hệ trong tháng")
    month: str = Field(..., description="Tháng liên hệ")
    duration: int = Field(..., ge=0, description="Thời lượng cuộc gọi (giây)")
    campaign: int = Field(..., ge=1, description="Số lần liên hệ trong chiến dịch")
    pdays: int = Field(..., ge=-1, description="Số ngày từ lần liên hệ trước")
    previous: int = Field(..., ge=0, description="Số lần liên hệ trước chiến dịch")
    poutcome: str = Field(..., description="Kết quả chiến dịch trước")

class PredictionResponse(BaseModel):
    prediction: str
    probability_yes: float
    probability_no: float
    model: str = "Decision Tree"
    interpretation: str

@app.post("/api/predict", response_model=PredictionResponse)
def predict_customer(customer: CustomerDataSchema):
    global predictor
    if predictor is None:
        predictor = BankDecisionTreePredictor()

    label, p_yes, p_no = predictor.predict(customer.dict())

    if label == "YES":
        interpretation = (
            "Mô hình dự đoán khách hàng có khả năng đăng ký tiền gửi có kỳ hạn. "
            "Nhân viên ngân hàng có thể ưu tiên đưa khách hàng vào danh sách tiếp cận, "
            "tư vấn sản phẩm tiết kiệm phù hợp và cung cấp thông tin về lãi suất, kỳ hạn."
        )
    else:
        interpretation = (
            "Mô hình dự đoán khách hàng có khả năng chưa đăng ký tiền gửi có kỳ hạn. "
            "Ngân hàng có thể xem xét chiến lược tiếp thị phù hợp hơn, tìm hiểu nhu cầu tài chính "
            "và lựa chọn thời điểm tiếp cận khác."
        )

    return {
        "prediction": label,
        "probability_yes": p_yes,
        "probability_no": p_no,
        "model": "Decision Tree Classifier",
        "interpretation": interpretation,
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Bank Marketing ML Service"}

if __name__ == "__main__":
    uvicorn.run("main_fastapi:app", host="0.0.0.0", port=8000, reload=True)
