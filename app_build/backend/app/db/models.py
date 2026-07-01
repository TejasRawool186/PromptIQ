from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    """Registered application users authenticated via Google OAuth."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # Google user ID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompts = relationship("PromptRecordDb", back_populates="user", cascade="all, delete-orphan")

class PromptRecordDb(Base):
    """Historical prompt gateway interactions stored for cost & skill analytics."""
    __tablename__ = "prompt_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", onDelete="CASCADE"), nullable=False)
    prompt_text = Column(String, nullable=False)
    response_summary = Column(String, nullable=True)
    category = Column(String, nullable=True)
    skill_domain = Column(String, nullable=True)
    complexity_score = Column(Float, default=0.0)
    necessity_score = Column(Float, default=0.0)
    model_used = Column(String, nullable=True)
    recommended_model = Column(String, nullable=True)
    estimated_cost = Column(Float, default=0.0)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="prompts")
