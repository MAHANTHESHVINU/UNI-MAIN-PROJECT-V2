import uuid
import json
import logging

from dotenv import load_dotenv
load_dotenv(override=True)

from backend.src.graph.workflow import app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("UNI-MAIN-PROJECT")


def run_cli_simulation():
    """
    Simulates the video compliance audit request.
    """

    session_id = str(uuid.uuid4())

    logger.info(f"Starting Audit Session: {session_id}")

    # Defines the initial state
    initial_inputs = {
        "video_url": "https://youtu.be/uv0NovEQldI?si=kTbS9jHbeyin_UWY",
        "video_id": f"vid_{session_id[:8]}",
        "compliance_results": [],
        "errors": []
    }

    print("\n------ INITIALIZING WORKFLOW ------")
    print(f"Input Payload: {json.dumps(initial_inputs, indent=2)}")

    try:
        final_state = app.invoke(initial_inputs)

        print("\n---- Workflow execution is complete ----")

        print("\nCompliance Audit Report ==")

        print(f"Video ID: {final_state.get('video_id')}")
        print(f"Status: {final_state.get('final_status')}")

        print("\n[VIOLATION DETECTED]")

        results = final_state.get("compliance_results", [])

        if results:
            for issue in results:
                print(
                    f"- [{issue.get('severity')}] "
                    f"[{issue.get('category')}] : "
                    f"{issue.get('description')}"
                )
        else:
            print("No violation is detected....")

        print("\n[Final Summary]")
        print(final_state.get("final_report"))

    except Exception as e:
        logger.error(f"Workflow Execution Failed: {str(e)}")
        raise


if __name__ == "__main__":
    run_cli_simulation()