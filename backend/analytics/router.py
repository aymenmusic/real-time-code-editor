"""
Analytics router — uses Pandas to analyze user data from the database.
Demonstrates ORM → DataFrame conversion, pd.to_datetime(), resample(),
groupby(), value_counts(), and JSON serialization.
"""

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from auth.utils import get_current_active_user
from models.user import User

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/users")
def get_user_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Return user analytics powered by Pandas.
    Requires authentication — only logged-in users can access.

    Queries the database via SQLAlchemy ORM, converts results into a
    Pandas DataFrame, then runs aggregations and returns JSON analytics.
    """
    # ── 1. Query with SQLAlchemy ORM, convert to Pandas DataFrame ────────
    users = db.query(User).all()

    user_dicts = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
        }
        for u in users
    ]

    df = pd.DataFrame(user_dicts)

    # ── 2. Data cleaning / transformation ─────────────────────────────────
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

    # ── 3. Core metrics ───────────────────────────────────────────────────
    total_users = len(df)
    active_users = int(df["is_active"].sum()) if total_users > 0 else 0
    inactive_users = total_users - active_users

    # ── 4. Time-series: signups per month (resample) ──────────────────────
    if total_users > 0 and df["created_at"].notna().any():
        monthly = (
            df.set_index("created_at")
            .resample("ME")  # Month-End buckets
            .size()
        )
        signups_by_month = {
            str(ts.date()): int(count) for ts, count in monthly.items()
        }
    else:
        signups_by_month = {}

    # ── 5. Value counts: most common email domains ───────────────────────
    if total_users > 0 and "email" in df.columns:
        df["domain"] = df["email"].str.split("@").str[1]
        top_domains = df["domain"].value_counts().head(5).to_dict()
    else:
        top_domains = {}

    # ── 6. Descriptive statistics on daily signups ────────────────────────
    if total_users > 0:
        daily = df.set_index("created_at").resample("D").size()
        summary_stats = {
            "mean_signups_per_day": round(float(daily.mean()), 2) if len(daily) > 0 else 0,
            "median_signups_per_day": round(float(daily.median()), 2) if len(daily) > 0 else 0,
            "max_signups_single_day": int(daily.max()) if len(daily) > 0 else 0,
            "days_with_signups": int((daily > 0).sum()),
            "total_days_span": len(daily),
        }
    else:
        summary_stats = {
            "mean_signups_per_day": 0,
            "median_signups_per_day": 0,
            "max_signups_single_day": 0,
            "days_with_signups": 0,
            "total_days_span": 0,
        }

    # ── 7. Assemble response ──────────────────────────────────────────────
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "signups_by_month": signups_by_month,
        "top_email_domains": top_domains,
        "summary_stats": summary_stats,
    }