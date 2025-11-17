from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
import os

class AnthropicConfig(BaseModel):
    engine: Literal["ANTHROPIC"] = Field(default="ANTHROPIC")
    model_name: str = Field(..., description="Nazwa modelu Anthropic")
    anthropic_api_key: str = Field(..., min_length=1, description="Klucz API Anthropic")
    
    @validator('anthropic_api_key')
    def validate_api_key(cls, v):
        if not v or v.strip() == "":
            raise ValueError("ANTHROPIC_API_KEY nie może być pusty")
        return v.strip()
