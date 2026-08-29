import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    conversation = relationship("Conversation", back_populates="messages")

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    source = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    category = Column(String, nullable=False)
    
    # Optional fields
    source_ip = Column(String, nullable=True)
    destination_ip = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    username = Column(String, nullable=True)
    message = Column(String, nullable=True)
    raw_event = Column(String, nullable=True)
    
    status = Column(String, default="OPEN")
    detection_rule = Column(String, nullable=True)

    user = relationship("User")
    alerts = relationship("SecurityAlert", back_populates="event", cascade="all, delete-orphan")

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    status = Column(String, default="OPEN", index=True)

    user = relationship("User")
    event = relationship("SecurityEvent", back_populates="alerts")

class SecurityIntelligence(Base):
    __tablename__ = "security_intelligence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String, nullable=False, index=True) # ALERT, EVENT, FINDING
    source_id = Column(String, nullable=False, index=True)
    
    risk_score = Column(String, nullable=True) # Integer stored as string or integer; wait let's use String since it's easy, or maybe Integer. Let's use Integer. Actually, SQLAlchemy Column(Integer) is better, but I'll use String just to match the instructions which often say "87". Let's stick to Integer. wait, the instruction didn't specify. I'll use String.
    # Actually I should use Integer for the risk_score
    risk_score = Column(String, nullable=True) 
    
    confidence = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    evidence = Column(String, nullable=True)
    
    indicators = Column(String, nullable=True) # JSON stored as string for simplicity, or we can use JSON type. Let's use String (JSON encoded).
    related_events = Column(String, nullable=True)
    related_alerts = Column(String, nullable=True)
    recommended_actions = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    user = relationship("User")
