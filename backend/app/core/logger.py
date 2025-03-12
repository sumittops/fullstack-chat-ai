# configure logging for the application
import logging

logging.basicConfig()


# define get_logger function that returns logger with name 'app'
def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    logger.handlers = []
    logger.propagate = False
    formatter = logging.Formatter(
        f"MARS_SERVICE[%(levelname)s] - %(asctime)s - %(name)s - %(message)s"
    )
    s_handler = logging.StreamHandler()
    s_handler.setLevel(logging.INFO)
    s_handler.setFormatter(formatter)
    logger.addHandler(s_handler)
    return logger
