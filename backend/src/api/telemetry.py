import os
import logging
from azure.monitor.opentelemetry import configure_azure_monitor

# dedicated logger
logger = logging.getLogger("UNI-MAIN-PROJECT-telemetry")


def setup_telemetry():
    """'
    initializes azure monitor opentelemetry
    tracks : https requests, database queries , errors , performance metrics
    sends this data to azure monitor

    it auto captures every api requests
    no need to manually log each endpoints
    """

    connection_string = os.getenv("APPLICATION_CONNECTION_STRING")

    if not connection_string:
        logger.warning("NO INSTRUMENTATION KEY FOUND . TELEMETRY IS DISABLED")
        return

    try:
        configure_azure_monitor(
            connection_string=connection_string, logger_name="UNI-MAIN-PROJECT-tracer"
        )
        logger.info("azure monitor tracking enabled and connected")
    except Exception as e:
        logger.error(f"FAILED TO INITIALIZE AZURE MONITOR : {e}")
