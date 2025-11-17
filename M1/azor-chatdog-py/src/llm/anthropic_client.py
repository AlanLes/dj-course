"""
Anthropic Claude LLM Client Implementation
Encapsulates all Anthropic Claude API interactions.
"""

import os
from typing import Optional, List, Dict, Any
from anthropic import Anthropic
from anthropic.types import Message
from dotenv import load_dotenv
from cli import console
from .anthropic_validation import AnthropicConfig


def _universal_history_to_anthropic(history: Optional[List[Dict[str, Any]]]) -> List[Dict[str, str]]:
    """
    Converts universal history format into Anthropic-compatible messages.
    Anthropic expects roles: 'user' or 'assistant'.
    
    Args:
        history: Universal format history with "user" and "model" roles
        
    Returns:
        List of Anthropic-compatible message dictionaries
    """
    if not history:
        return []
    
    messages: List[Dict[str, str]] = []
    for entry in history:
        if not isinstance(entry, dict):
            continue
        
        role = entry.get("role")
        parts = entry.get("parts", [])
        text = ""
        
        if isinstance(parts, list) and parts:
            first_part = parts[0]
            if isinstance(first_part, dict):
                text = first_part.get("text", "")
        
        if not text:
            continue
        
        # Convert "model" to "assistant" for Anthropic
        if role == "model":
            role = "assistant"
        
        if role not in ("user", "assistant"):
            continue
        
        messages.append({"role": role, "content": text})
    
    return messages


def _extract_text_from_response(response: Message) -> str:
    """
    Extracts plain text from an Anthropic Message response.
    
    Args:
        response: Anthropic Message object
        
    Returns:
        Extracted text string
    """
    if not hasattr(response, "content"):
        return ""
    
    text_parts: List[str] = []
    for block in response.content:
        block_text = getattr(block, "text", None)
        if block_text:
            text_parts.append(block_text)
    
    return "\n".join(part for part in text_parts if part).strip()


class AnthropicResponse:
    """
    Response object that mimics the Gemini response interface.
    Provides a .text attribute containing the response text.
    """
    
    def __init__(self, text: str, raw_response: Optional[Message] = None):
        self.text = text
        self.raw_response = raw_response


class AnthropicChatSessionWrapper:
    """
    Wrapper for Anthropic chat sessions that provides universal dictionary-based history format.
    This ensures compatibility with the universal history format used across all clients.
    """
    
    def __init__(
        self,
        client: Anthropic,
        model_name: str,
        system_instruction: str,
        history: Optional[List[Dict[str, Any]]] = None,
        thinking_budget: int = 0,
        max_tokens: int = 1024,
    ):
        """
        Initialize wrapper with Anthropic client.
        
        Args:
            client: Anthropic client instance
            model_name: Model identifier
            system_instruction: System prompt for the assistant
            history: Previous conversation history in universal format
            thinking_budget: Budget for Extended Thinking (if > 0)
            max_tokens: Maximum tokens in response
        """
        self._client = client
        self.model_name = model_name
        self.system_instruction = system_instruction or ""
        self.thinking_budget = thinking_budget
        self.max_tokens = max_tokens
        self._history = list(history) if history else []
    
    def send_message(self, text: str) -> AnthropicResponse:
        """
        Sends a message to Anthropic and returns a response wrapper.
        
        Args:
            text: User's message
            
        Returns:
            AnthropicResponse object with .text attribute
        """
        # Add user message to history in universal format
        user_entry = {"role": "user", "parts": [{"text": text}]}
        self._history.append(user_entry)
        
        try:
            # Convert history to Anthropic format
            messages = _universal_history_to_anthropic(self._history)
            
            # Prepare Extended Thinking arguments if budget > 0
            thinking_args = None
            if self.thinking_budget > 0:
                thinking_args = {
                    "type": "structured",
                    "budget_tokens": self.thinking_budget
                }
            
            # Build request arguments
            request_kwargs: Dict[str, Any] = {
                "model": self.model_name,
                "system": self.system_instruction,
                "messages": messages,
                "max_tokens": self.max_tokens,
            }
            if thinking_args:
                request_kwargs["thinking"] = thinking_args
            
            # Send message to Anthropic
            response = self._client.messages.create(**request_kwargs)
            
            # Extract response text
            response_text = _extract_text_from_response(response) or ""
            
            # Add assistant response to history in universal format (use "model" role)
            assistant_entry = {"role": "model", "parts": [{"text": response_text}]}
            self._history.append(assistant_entry)
            
            return AnthropicResponse(response_text, response)
            
        except Exception as exc:
            console.print_error(f"Błąd podczas komunikacji z Anthropic: {exc}")
            error_text = "Przepraszam, wystąpił błąd podczas komunikacji z Anthropic."
            self._history.append({"role": "model", "parts": [{"text": error_text}]})
            return AnthropicResponse(error_text)
    
    def get_history(self) -> List[Dict[str, Any]]:
        """
        Returns conversation history in universal dictionary format.
        
        Returns:
            List of dictionaries with format: {"role": "user|model", "parts": [{"text": "..."}]}
        """
        return self._history


class AnthropicLLMClient:
    """
    Encapsulates all Anthropic Claude API interactions.
    Provides a clean interface compatible with GeminiLLMClient and LlamaClient.
    """
    
    def __init__(self, model_name: str, api_key: str, max_response_tokens: int = 1024):
        """
        Initialize the Anthropic LLM client with explicit parameters.
        
        Args:
            model_name: Model to use (e.g., 'claude-3-5-haiku-latest')
            api_key: Anthropic API key
            max_response_tokens: Maximum tokens in model responses
            
        Raises:
            ValueError: If api_key is empty or None
        """
        if not api_key:
            raise ValueError("Anthropic API key cannot be empty or None")
        
        self.model_name = model_name
        self.api_key = api_key
        self.max_response_tokens = max_response_tokens
        
        # Initialize the client during construction
        self._client = self._initialize_client()
    
    @staticmethod
    def preparing_for_use_message() -> str:
        """
        Returns a message indicating that Anthropic client is being prepared.
        
        Returns:
            Formatted preparation message string
        """
        return "🤖 Przygotowywanie klienta Anthropic..."
    
    @classmethod
    def from_environment(cls) -> "AnthropicLLMClient":
        """
        Factory method that creates an AnthropicLLMClient instance from environment variables.
        
        Returns:
            AnthropicLLMClient instance initialized with environment variables
            
        Raises:
            ValueError: If required environment variables are not set
        """
        load_dotenv()
        
        # Validation using Pydantic
        config = AnthropicConfig(
            model_name=os.getenv("MODEL_NAME", "claude-3-5-haiku-latest"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", "")
        )
        
        return cls(model_name=config.model_name, api_key=config.anthropic_api_key)
    
    def _initialize_client(self) -> Anthropic:
        """
        Initializes the Anthropic client.
        
        Returns:
            Initialized Anthropic client
            
        Raises:
            RuntimeError: If client initialization fails
        """
        try:
            return Anthropic(api_key=self.api_key)
        except Exception as exc:
            console.print_error(f"Błąd inicjalizacji klienta Anthropic: {exc}")
            raise RuntimeError(f"Failed to initialize Anthropic client: {exc}") from exc
    
    def create_chat_session(
        self,
        system_instruction: str,
        history: Optional[List[Dict[str, Any]]] = None,
        thinking_budget: int = 0
    ) -> AnthropicChatSessionWrapper:
        """
        Creates a new chat session with the specified configuration.
        
        Args:
            system_instruction: System role/prompt for the assistant
            history: Previous conversation history (optional, in universal dict format)
            thinking_budget: Thinking budget for Extended Thinking (0 = disabled)
            
        Returns:
            AnthropicChatSessionWrapper with universal dictionary-based interface
        """
        if not self._client:
            raise RuntimeError("Anthropic client not initialized")
        
        return AnthropicChatSessionWrapper(
            client=self._client,
            model_name=self.model_name,
            system_instruction=system_instruction,
            history=history or [],
            thinking_budget=thinking_budget,
            max_tokens=self.max_response_tokens
        )
    
    def count_history_tokens(self, history: List[Dict[str, Any]]) -> int:
        """
        Counts tokens for the given conversation history.
        
        Args:
            history: Conversation history in universal dict format
            
        Returns:
            Total token count
        """
        if not history:
            return 0
        
        try:
            # Convert universal dict format to Anthropic messages for token counting
            messages = _universal_history_to_anthropic(history)
            
            # Use Anthropic's token counting API
            response = self._client.messages.count_tokens(
                model=self.model_name,
                system=self.system_instruction if hasattr(self, 'system_instruction') else "",
                messages=messages
            )
            return response.input_tokens
            
        except Exception as exc:
            console.print_error(f"Błąd podczas liczenia tokenów w Anthropic: {exc}")
            return 0
    
    def get_model_name(self) -> str:
        """Returns the currently configured model name."""
        return self.model_name
    
    def is_available(self) -> bool:
        """
        Checks if the LLM service is available and properly configured.
        
        Returns:
            True if client is properly initialized and has API key
        """
        return self._client is not None and bool(self.api_key)
    
    def ready_for_use_message(self) -> str:
        """
        Returns a ready-to-use message with model info and masked API key.
        
        Returns:
            Formatted message string for display
        """
        # Mask API key - show first 4 and last 4 characters
        if len(self.api_key) <= 8:
            masked_key = "****"
        else:
            masked_key = f"{self.api_key[:4]}...{self.api_key[-4:]}"
        
        return f"✅ Klient Anthropic gotowy do użycia (Model: {self.model_name}, Key: {masked_key})"
    
    @property
    def client(self) -> Anthropic:
        """
        Provides access to the underlying Anthropic client for backwards compatibility.
        This property should be used sparingly and eventually removed.
        """
        return self._client
