"""
Quy trình huấn luyện mô hình Decision Tree trên tập dữ liệu Bank Marketing (11,162 bản ghi).
Tuân thủ đầy đủ các bước trong đề bài:
1. Data Preprocessing: Xử lý missing values, tách Numerical & Categorical features.
2. Pipeline & ColumnTransformer: SimpleImputer + OneHotEncoder(handle_unknown="ignore").
3. Train/Test Split: 80% train / 20% test, random_state=42, stratify=y.
4. DecisionTreeClassifier: Các tham số criterion, max_depth, min_samples_split, min_samples_leaf.
5. Model Evaluation: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, Classification Report.
6. Lưu mô hình bằng Joblib: decision_tree_bank_model.joblib.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

def train_bank_marketing_model(
    data_path: str = "data/bank.csv",
    output_model_path: str = "decision_tree_bank_model.joblib",
    criterion: str = "gini",
    max_depth: int = 6,
    min_samples_split: int = 10,
    min_samples_leaf: int = 5,
    class_weight = None
):
    print(f"--> Đang đọc dữ liệu từ: {data_path}")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Không tìm thấy tệp {data_path}")

    df = pd.read_csv(data_path)
    print(f"Số lượng mẫu: {df.shape[0]}, Số lượng cột: {df.shape[1]}")

    target_col = "deposit"
    if target_col not in df.columns:
        raise ValueError(f"Biến mục tiêu '{target_col}' không tồn tại trong dataset.")

    # 1. Phân chia features và target
    X = df.drop(columns=[target_col])
    y = df[target_col].map({"yes": 1, "no": 0})

    # Tách Numerical & Categorical features
    numerical_features = ["age", "balance", "day", "duration", "campaign", "pdays", "previous"]
    categorical_features = [
        "job", "marital", "education", "default", "housing", "loan", "contact", "month", "poutcome"
    ]

    # 2. Xây dựng Preprocessing Pipeline
    numerical_transformer = SimpleImputer(strategy="median")
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_transformer, numerical_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    # 3. Train/Test Split (80% / 20%, stratify = y, random_state = 42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Kích thước tập huấn luyện: {X_train.shape[0]} mẫu.")
    print(f"Kích thước tập kiểm thử: {X_test.shape[0]} mẫu.")

    # 4. Định nghĩa Classifier & Full Pipeline
    clf = DecisionTreeClassifier(
        criterion=criterion,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        class_weight=class_weight,
        random_state=42,
    )

    model_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ]
    )

    # 5. Huấn luyện trên tập Train
    print("--> Đang huấn luyện Decision Tree Pipeline...")
    model_pipeline.fit(X_train, y_train)

    # 6. Đánh giá trên tập Test độc lập
    y_pred = model_pipeline.predict(X_test)
    y_proba = model_pipeline.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, pos_label=1)
    rec = recall_score(y_test, y_pred, pos_label=1)
    f1 = f1_score(y_test, y_pred, pos_label=1)
    cm = confusion_matrix(y_test, y_pred)

    print("\n====== KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH TRÊN TẬP TEST (20%) ======")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["NO", "YES"]))

    # 7. Huấn luyện mô hình cuối cùng trên 100% dữ liệu có nhãn
    print("--> Huấn luyện mô hình cuối cùng trên 100% dữ liệu...")
    final_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ]
    )
    final_pipeline.fit(X, y)

    # 8. Lưu Pipeline bằng Joblib
    joblib.dump(final_pipeline, output_model_path)
    print(f"--> Đã lưu thành công mô hình vào: {output_model_path}")

    return final_pipeline, {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "confusion_matrix": cm.tolist(),
    }

if __name__ == "__main__":
    train_bank_marketing_model()
