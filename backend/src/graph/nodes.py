import json
import os
import logging
import re 
from typing import Dict , Any , List

from langchain_openai import AzureChatOpenAi , AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureSearch
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage , HumamMessage

#IMPORT STATE SCHEMA 
from backend.src.graph.state import VideoAuditState , ComplianceIssue

#import service 
from backend.src.services.video_indexer import VideoIndexerService

#configure the logger

logger = logging.getLogger("brand-guardian")
logging.basicConfig(level=logging.INFO)

#NODE 1 : INDEXER 

def index_video_node(state:VideoAuditState) -> Dict[str,Any]:
    '''
        DOWNLOADS THE YT VIDEO FROM THE URL 
        UPLOADS THE VIDEO TO AZURE VIDEO INDEXER
        EXTRACTS THE INSIGHTS
    '''
    video_url =state.get("vedio_url")
    video_id_input = state.get("video_id","video_demo")

    logger.info(f"----[NODE:INDEXER] Processing : {video_url}")

    local_file = "temp_audit_video.mp4"

    try:
        vi_service = VideoIndexerService()

        #DOWNLOAD 
        if "youtube.com" in video_url or "youtube" in video_url :
            local_path = vi_service.download_youtube_video(video_url, output_path = local_filename)
        else:
            raise Exception("PLEASE PROVIDE A VALID YOUTUBE URL FOR THIS TEST ")
         
        #UPLOADS
        azure_video_id = vi_service.upload_video(local_path, video_name = video_id_input)
        logger.info(f"UPLOADS SUCCESS. AZURE ID :{azure_video_id}")

        #CLEANUP 
        if os.path.exists(local_path):
            os.remove(local_path)

        #WAIT 
        raw_insights = vi_service.wait_for_processing(azure_vedio_id)

        #EXTRACTS
        clean_data = vi_service.extract_data(raw_insights)
        logger.info("---[Node :INDEXER] EXTRACTION COMPLETE---")
        return clean_data
    
    except Exception as e:
        logger.error(f"VIDEO INDEXER FAILED: {e}")
        return {
            "error" : [str(e)],
            "final_status" : "FAIL",
            "transcript" : "",
            "ocr_text" : []
            
        }

def audio_content_node(state:VideoAuditState) -> Dict[str,Any]:

    '''
        PERFORMS RAG TO AUDIT THE CONTENT - BRAND VIDEO

    '''
    
    logger.info("---[NODE: AUDITOR] QUERYING KNOWLEDGE BASE AND LLM")
    transcript = state.get("transcript","")
    if not transcript :
        logger.warning("NO TRANSCRIPT AVAILABLE. SKIPPING AUDIT")
        return {
            "final_status" : "FAIL"
            "final_report" : "AUDIT SKIPPED BECAUSE VIDEO PROCESSING FAILED (NO TRANSCRIPT)"

        }

    

    llm = AzureChatOpenAI(
        azure_deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT"),
        open_api_version = os.getenv("AZURE_OPENAI_API_VERSION"),
        temperature = 0.0
    )
 
    embeddings = AzureOpenAIEmbeddings(
        azure_deployment = "text-embedding-3-small",
        open_api_version =os.getenv("AZURE_OPENAI_API_VERSION")
    )

    vector_store = AzureSearch(
        azure_search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT"),
        azure_search_key = os.getenv("AZURE_SEARCH_API_KEY"),
        index_name = os.getenv("AZURE_SEARCH_INDEX_NAME"),
        embedding_function = embeddings.embed_query

    )

    #RAG RETRIEVAL
    ocr_text = state.get("ocr_text",[])
    query_text = f"{transcript}{.join(ocr_text}"
    docs = vector_store.similarity_search(query_text,k=3)
    retrieved_rules = "\n\n".join([doc.page_content for doc in docs])

    
    system_prompt = f"""
                you are a senior brand compliance auditor 
                official regulatory rules : {retrieved_rules}
                INSTRUCIONS:
                {{
                    "compliance_results": [
                {{
                     "category": "Claim Validation",
                     "severity": "CRITICAL",
                     "description": "Explanation of the violation..."
                }}
                    ],
                "status": "FAIL",
                "final_report": "Summary of findings..."
                }}

                If no violation are found , set "status" to "PASS" and "compliance_results" to [].
                """
    

    user_message = f""" 
                VIDEO_METADATA : {state.get('video_metadata',{})}
                TRANSCRIPT: {transcript}
                ON-SCREEN TEXT (OCR) : {ocr_text}

                            
                    """ 
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumamMessage(content=user_message)
        ])

        content = response.content
        if "```" in content :
            content = re.search(r"```(?:json)?(.?)```,content , re.DOTALL").group(1)
        audit_data = json.loads(content.strip())
        return{
            "compliance_results" : audit_data.get("compliance_results",[]),
            "final_status" : audit_data.get("status","FAIL")
            "final_report" : audit_data.get("fianl_report","No report generated")

        }

    except Exception as e:
        logger.error(f"System Error in Auditor Node :{str(e)}")
        #logging the raw response
        logger.error(f"Raw LLM response : {response.content if 'reponse' in locals() elsse 'None'}")
        return{
        "errors": [str(e)],
        "final_status": "FAIL"
    }             
