import uuid
import logging
from fastapi import FASTAPI, HTTPException

from pydantic import BaseModel
from typing import List, Optional, override

from dotenv import load_dotenv

load_dotenv(override=True)

from backend.src.api.telemetry import setup_telemetry

setup_telemetry()

from backend.src.graph.workflow import app as compliance_graph

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("api-server")

app = FASTAPI(
    title="UNI-MAIN-PROJECT API",
    description="API for Auditing video content against the brand compliance rules",
    version="1.0.0",
)


class AuditRequest(BaseModel):
    video_url : str 

class ComplianceIssue(BaseModel):
    category : str 
    severity : str
    description : str 

class AuditResponse(BaseModel):
    session_id : str
    video_id : str 
    status_id : str 
    final_report : str 
    compliance_results : List[ComplianceIssue]

@app.post("/audit",response_model = AuditRequest) 

async def audit_video(request:AuditRequest):

    session_id = str(uuid.uuid4())
    video_id_short = f"vid_{session_id[:8]}"
    logger.info(f'Recieved the Audit Request : {request.video_url} (Session :{session_id}) ' )

    initial_inputs = {
        "vedio_url" : request.vedio_url,
        "video_id" : video_id_short ,
        "compliance_results" : [],
        "error" = []
    }

    try :

        final_state = compliance_graph.invoke(initial_inputs)
        return AuditRequest(
            session_id = session_id ,
            video_id = final_state.get("video_id"),
            status = final_state.get("final_report","UNKNOWN"),
            final_report = final_state.get("compliance_results",[])

        )
    except Exception as e :
        logger.error(f"Audit Failed : {str(e)}")
        raise HTTPException(
            status_code = 500 ,
            detail = f"WorkFlow Execution Failed : {str(e)}"
        )

@app.get("/health")
def health_check():

    return {"status" : "healthy" , "service":"UNI-MAIN-PROJECT AI"}
