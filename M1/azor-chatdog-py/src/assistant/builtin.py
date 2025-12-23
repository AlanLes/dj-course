from .assistent import Assistant
from .azor import create_azor_assistant
from .azor import create_aza_assistant
from .azor import create_reksio_assistant
from .registry import AssistantRegistry

def register_builtin_assistants():
    """
    Register builtin assistants.
    """
    return [
        AssistantRegistry.register(create_azor_assistant()),
        AssistantRegistry.register(create_aza_assistant()),
        AssistantRegistry.register(create_reksio_assistant()),
    ]