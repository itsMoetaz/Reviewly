import logging
from pathlib import Path


def setup_security_logging():
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.INFO)

    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")

    file_handler = logging.FileHandler("logs/security.log")
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    security_logger.addHandler(file_handler)
    security_logger.addHandler(console_handler)

    return security_logger


security_logger = setup_security_logging()
