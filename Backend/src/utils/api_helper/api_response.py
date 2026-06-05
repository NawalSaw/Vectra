class ApiResponse:
    def __init__(self, status_code=200, message="Success", data=None):
        self.status_code = status_code
        self.message = message
        self.data = data
        self.success = True

    def to_dict(self):
        return {
            "success": self.success,
            "status_code": self.status_code,
            "message": self.message,
            "data": self.data,
        }

    def __str__(self):
        return str(self.to_dict())