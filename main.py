import uuid
import json
import logging

from dotenv import load_dotenv
load_dotenv(override=True)

from backend.src.graph.workflow import app


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("UNI-MAIN-PROJECT")


# ---------------------------------------------------------
# CLI Simulation
# ---------------------------------------------------------

def run_cli_simulation():
    """
    Simulates the video compliance audit request.
    """

    session_id = str(uuid.uuid4())

    logger.info(
        f"Starting Audit Session: {session_id}"
    )

    # -----------------------------------------------------
    # Initial State
    # -----------------------------------------------------

    initial_inputs = {
        "video_url": "https://youtu.be/eOY-g6ikFVU?si=ngJHDbv5tuW8TygSY",
        "video_id": f"vid_{session_id[:8]}",
        "compliance_results": [],
        "errors": []
    }

    print("\n------ INITIALIZING WORKFLOW ------")

    print(
        f"Input Payload: "
        f"{json.dumps(initial_inputs, indent=2)}"
    )

    # -----------------------------------------------------
    # Execute LangGraph Workflow
    # -----------------------------------------------------

    try:

        final_state = app.invoke(
            initial_inputs
        )

        print(
            "\n---- Workflow execution is complete ----"
        )

        # =================================================
        # AUDIT REPORT
        # =================================================

        print("\n==============================")
        print("   COMPLIANCE AUDIT REPORT")
        print("==============================")

        print(
            f"\nVideo ID : "
            f"{final_state.get('video_id', 'N/A')}"
        )

        status = final_state.get(
            "final_status",
            "UNKNOWN"
        )

        print(
            f"Status   : {status}"
        )

        # =================================================
        # VIOLATIONS
        # =================================================

        results = final_state.get(
            "compliance_results",
            []
        )

        if results:

            print(
                f"\n[VIOLATIONS DETECTED: "
                f"{len(results)}]"
            )

            for index, issue in enumerate(
                results,
                start=1
            ):

                category = issue.get(
                    "category",
                    "N/A"
                )

                severity = issue.get(
                    "severity",
                    "N/A"
                )

                description = issue.get(
                    "description",
                    "N/A"
                )

                print(
                    f"\n{index}. {category}"
                )

                print(
                    f"   Severity    : {severity}"
                )

                print(
                    f"   Description : {description}"
                )

        else:

            print(
                "\n[NO VIOLATIONS DETECTED]"
            )

        # =================================================
        # FINAL SUMMARY
        # =================================================

        print("\n[FINAL SUMMARY]")

        print(
            final_state.get(
                "final_report",
                "No report generated."
            )
        )

        # =================================================
        # ERRORS
        # =================================================

        errors = final_state.get(
            "errors",
            []
        )

        if errors:

            print("\n[ERRORS]")

            for error in errors:

                print(
                    f"- {error}"
                )

    # -----------------------------------------------------
    # Workflow Error
    # -----------------------------------------------------

    except Exception as e:

        logger.error(
            f"Workflow Execution Failed: {str(e)}"
        )

        raise


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

if __name__ == "__main__":
    run_cli_simulation()