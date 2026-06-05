import traceback

class ApiError(RuntimeError):
    def __init__(self, status_code, message, trace=None):
        super().__init__(message)

        self.status_code = status_code
        self.message = message
        self.success = False

        # Auto-generate traceback if not provided
        self.trace = trace or traceback.format_exc()

    def to_dict(self):
        return {
            "success": self.success,
            "status_code": self.status_code,
            "message": self.message,
            "trace": self.trace,
        }

    def __str__(self):
        return f"[{self.status_code}] {self.message}"