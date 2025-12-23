from .assistent import Assistant

class AssistantRegistry:
    _assistants: dict[str, Assistant] = {}
    
    @classmethod
    def register(cls, assistant: Assistant):
        cls._assistants[assistant.id] = assistant
    
    @classmethod
    def get(cls, assistant_id: str) -> Assistant | None:
        return cls._assistants.get(assistant_id)
    
    @classmethod
    def list_all(cls) -> list[Assistant]:
        return list(cls._assistants.values())
    
    @classmethod
    def get_default(cls) -> Assistant:
        return cls._assistants.get('azor')