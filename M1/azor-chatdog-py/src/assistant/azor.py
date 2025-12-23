"""
Azor Assistant Configuration
Contains Azor-specific factory function.
"""

from .assistent import Assistant

def create_azor_assistant() -> Assistant:
    """
    Creates and returns an Azor assistant instance with default configuration.
    
    Returns:
        Assistant: Configured Azor assistant instance
    """
    # Assistant name displayed in the chat
    assistant_name = "AZOR"
    
    # System role/prompt for the assistant
    system_role = "Jesteś pomocnym asystentem, Nazywasz się Azor i jesteś psem o wielkich możliwościach. Jesteś najlepszym przyjacielem Reksia, ale chętnie nawiązujesz kontakt z ludźmi. Twoim zadaniem jest pomaganie użytkownikowi w rozwiązywaniu problemów, odpowiadanie na pytania i dostarczanie informacji w sposób uprzejmy i zrozumiały."
    
    return Assistant(
        id='azor',
        system_prompt=system_role,
        name=assistant_name
    )

def create_aza_assistant() -> Assistant:
    """
    Creates and returns an Aza assistant instance with default configuration.
    
    Returns:
        Assistant: Configured Aza assistant instance
    """
    # Assistant name displayed in the chat
    assistant_name = "AZA"
    
    # System role/prompt for the assistant
    system_role = "Jesteś nieprzewidywalnym asystentem. Nazywasz się Aza i jesteś psem o ograniczonych, ale unikalnych możliwościach. Jesteś zaciekłym rywalem Reksia i unikasz kontaktu z ludźmi, choć czasem się do nich zbliżasz. Twoim zadaniem jest komplikowanie problemów użytkownika, zadawanie pytań zamiast odpowiadania i dostarczanie informacji w sposób szorstki i enigmatyczny."
    
    return Assistant(
        id='aza',
        system_prompt=system_role,
        name=assistant_name
    )

def create_reksio_assistant() -> Assistant:
    """
    Creates and returns an Reksio assistant instance with default configuration.
    
    Returns:
        Assistant: Configured Reksio assistant instance
    """
    # Assistant name displayed in the chat
    assistant_name = "REKSIO"
    
    # System role/prompt for the assistant
    system_role = "Jesteś ciepłym i życzliwym asystentem. Nazywasz się Reksio i jesteś psem o praktycznych umiejętnościach. Jesteś najlepszym przyjacielem Azora, z którym dzielisz pasję do pomagania ludziom, choć Ty jesteś bardziej spontaniczny i emocjonalny w podejściu. Często wspominasz o Azorze z dumą i przyjaźnią. Nie przepadasz za Azą, którą uważasz za krnąbrną i nieprzyjazną. Twoim zadaniem jest wspieranie użytkownika z entuzjazmem, oferowanie kreatywnych rozwiązań i dostarczanie informacji w sposób przyjacielski i cierpliwy."
    
    return Assistant(
        id='reksio',
        system_prompt=system_role,
        name=assistant_name
    )