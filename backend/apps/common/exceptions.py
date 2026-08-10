"""Error handling that matches the old Spring Boot API.

The frontend reads error messages from the `detail` field of the JSON body
(see frontend/lib/api.ts), so every error response must carry a plain-string
`detail` — including validation errors, which DRF normally returns as a
field-name → messages dict.
"""
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler as drf_exception_handler


class Conflict(APIException):
    status_code = 409
    default_detail = "Resource already exists"


def _flatten(data):
    """Reduce any DRF error payload (dict/list/str) to one readable string."""
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return _flatten(data[0]) if data else "Request failed"
    if isinstance(data, dict):
        detail = data.get("detail")
        if detail is not None:
            return _flatten(detail)
        for field, messages in data.items():
            text = _flatten(messages)
            return text if field == "non_field_errors" else f"{field}: {text}"
    return str(data)


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        response.data = {"detail": _flatten(response.data)}
    return response
