"""
Module tải mô hình Joblib và thực hiện dự đoán phân loại khách hàng.
"""

import os
import joblib
import pandas as pd
from typing import Dict, Any, Tuple

class BankDecisionTreePredictor:
    def __init__(self, model_path: str = "decision_tree_bank_model.joblib"):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Mô hình '{self.model_path}' không tồn tại. Vui lòng chạy train_decision_tree.py trước."
            )
        self.model = joblib.load(self.model_path)
        print(f"--> Đã nạp thành công mô hình từ: {self.model_path}")

    def predict(self, customer_dict: Dict[str, Any]) -> Tuple[str, float, float]:
        """
        Dự đoán nhãn YES/NO và xác suất từ dict dữ liệu khách hàng.
        Trả về: (prediction, prob_yes, prob_no)
        """
        if self.model is None:
            self.load_model()

        # Tạo DataFrame đúng thứ tự 16 features
        expected_columns = [
            "age", "job", "marital", "education", "default", "balance",
            "housing", "loan", "contact", "day", "month", "duration",
            "campaign", "pdays", "previous", "poutcome"
        ]

        row = {col: customer_dict.get(col) for col in expected_columns}
        df_input = pd.DataFrame([row])

        # Thực hiện predict và predict_proba
        pred_val = self.model.predict(df_input)[0]
        probas = self.model.predict_proba(df_input)[0]

        # probas[0] là lớp 0 (NO), probas[1] là lớp 1 (YES)
        prob_no = round(float(probas[0]) * 100, 2)
        prob_yes = round(100.0 - prob_no, 2) # Bảo đảm tổng bằng 100%
        label = "YES" if pred_val == 1 else "NO"

        return label, prob_yes, prob_no
