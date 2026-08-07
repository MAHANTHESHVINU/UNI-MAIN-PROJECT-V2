import operator
from typing import Annotated,List ,Dict ,Optional,Any ,TypedDict

#DEFINE THE SCHEMA FOR A SINGLE COMPLIANCE RESULT 

class ComplianceIssue(TypedDict):
    category : str 
    description : str 
    severity : str 
    timestamp : Optional[str]

#DEFINE THE GLOBAL GRAPH STATE 

class VideoAuditState(TypedDict):
    ''' 
    DEFINES THE DATA SCHEMA FOR LANGGRAPH EXECUTION CONTENT 
    '''
    #input parameters 

    video_url : str
    video_id : str

    #INGESTION AND EXTRACTION DATA 

    Local_file_path : Optional[str]
    video_metadata : Dict[str,Any]
    transcript : Optional[str]
    ocr_text : List[str]

    #ANLYSIS OUTPUT 

    compliance_result : Annotated[List[ComplianceIssue], operator.add]

    #FINAL DELIVERABLES

    final_status : str
    final_report : str 

    #SYSTEM OBSERVABILITY 
    
    errors : Annotated[list[str],operator.add]





 
