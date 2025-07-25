import enum

class StatusEnum(str, enum.Enum):

    processing = "processing"
    processed = "processed"
    failed = "failed"