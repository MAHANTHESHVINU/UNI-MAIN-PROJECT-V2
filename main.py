import uuid 
import json 
import logging 
from pprint import pprint 

from dotenv import load_dotenv
load_dotenv(override = True)

from backend.src.graph.workflow import app 

logging.basicConfig(
    level = logging.INFO,
    format = '%(asctime)s - %(levelname)s - %(message)s '

)
logger = logging.getLogger("brand_guardian_runner")

def run_cli_simulation():
    '''
        Simulates the video compliance audit request
    '''
    session_id = str(uuid.uuid4())
    logger.info(f"starting Audit Session : {session_id}")

    #defines the initial state 
    initial_inputs = {
        "video_url" : "",
        "video_id": f"vid_{session_id[:8]}",
        "compliance_results" : [],
        "errors" : []

    }

    print("\n------INITIALIZING WORKFLOW------")
    print(f"input Payload : {json.dumps(initial_inputs , Indent = 2)}")

    try :
        final_state = app.invoke(initial_inputs)
        print("\n----Workflow execution is commplete----")

        print("\n Compliance Audit Report ==")
        print(f"Video ID : {final_state.get('final_status')}")
        print(f"Status : {final_state.get('final_status')}")
        print("\n [VIOLATION DETECTED] ")
        results = final_state.get('compliance_results',[])
        if results:
            for issue in results :
                print(f"- [{issue.get('severity')}] [{issue.get('category')}] : [{issue.get('description')}")
        else :
            print("No violation is detected....")
        print("\n[Final Summary]")
        print(final_state.get('final_report'))

        except Exception as e :
            logger.errior(f"Workflow Execution Failed : {str(e)}")
            raise e 

if __name__ == "main":
    run_cli_simulation()
