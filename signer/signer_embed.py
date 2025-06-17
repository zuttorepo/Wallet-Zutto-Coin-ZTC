import getpass

PIN = "05101987"

def validate_pin():
    user_pin = getpass.getpass("Enter PIN: ")
    if user_pin != PIN:
        raise PermissionError("Invalid PIN")
    return True

def sign_with_pin(data):
    if validate_pin():
        return "signed_data_placeholder"