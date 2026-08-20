import json
import os
import logging
import re
from typing import Dict, Any

from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureSearch
from langchain_core.messages import SystemMessage, HumanMessage

# IMPORT STATE SCHEMA
from backend.src.graph.state import VideoAuditState

# IMPORT SERVICE
from backend.src.services.video_indexer import VideoIndexerService


# ---------------------------------------------------------
# LOGGER
# ---------------------------------------------------------

logger = logging.getLogger("UNI-MAIN-PROJECT")
logging.basicConfig(level=logging.INFO)


# =========================================================
# NODE 1: VIDEO INDEXER
# =========================================================

def index_video_node(state: VideoAuditState) -> Dict[str, Any]:
    """
    Downloads the YouTube video,
    uploads it to Azure Video Indexer,
    waits for processing,
    and extracts transcript/OCR/metadata.
    """

    video_url = state.get("video_url")
    video_id_input = state.get("video_id", "video_demo")

    logger.info(
        f"----[NODE:INDEXER] Processing : {video_url}"
    )

    local_file = "temp_audit_video.mp4"

    try:

        vi_service = VideoIndexerService()

        # -------------------------------------------------
        # DOWNLOAD YOUTUBE VIDEO
        # -------------------------------------------------

        if "youtube.com" in video_url or "youtu.be" in video_url:

            local_path = vi_service.download_youtube_video(
                video_url,
                output_path=local_file
            )

        else:

            raise Exception(
                "PLEASE PROVIDE A VALID YOUTUBE URL FOR THIS TEST"
            )

        # -------------------------------------------------
        # UPLOAD TO AZURE VIDEO INDEXER
        # -------------------------------------------------

        azure_video_id = vi_service.upload_video(
            local_path,
            video_name=video_id_input
        )

        logger.info(
            f"UPLOAD SUCCESS. AZURE ID : {azure_video_id}"
        )

        # -------------------------------------------------
        # WAIT FOR VIDEO PROCESSING
        # -------------------------------------------------

        raw_insights = vi_service.wait_for_processing(
            azure_video_id
        )

        # -------------------------------------------------
        # CLEANUP LOCAL VIDEO
        # -------------------------------------------------

        if os.path.exists(local_path):
            os.remove(local_path)

        # -------------------------------------------------
        # EXTRACT INSIGHTS
        # -------------------------------------------------

        clean_data = vi_service.extract_data(
            raw_insights
        )

        logger.info(
            "---[NODE:INDEXER] EXTRACTION COMPLETE---"
        )

        return clean_data

    except Exception as e:

        logger.error(
            f"VIDEO INDEXER FAILED: {e}"
        )

        # Cleanup even if something fails
        if os.path.exists(local_file):
            try:
                os.remove(local_file)
            except Exception:
                pass

        return {
            "errors": [str(e)],
            "final_status": "FAIL",
            "transcript": "",
            "ocr_text": [],
            "final_report": (
                "AUDIT SKIPPED BECAUSE VIDEO PROCESSING FAILED."
            )
        }


# =========================================================
# NODE 2: COMPLIANCE AUDITOR
# =========================================================

def audit_content_node(
    state: VideoAuditState
) -> Dict[str, Any]:
    """
    Performs RAG-based compliance auditing.

    Pipeline:

        Transcript/OCR
              ↓
        Azure AI Search
              ↓
        Regulatory rules
              ↓
        Azure OpenAI GPT-4o
              ↓
        Structured compliance result
    """

    logger.info(
        "---[NODE: AUDITOR] QUERYING KNOWLEDGE BASE AND LLM"
    )

    # -----------------------------------------------------
    # GET TRANSCRIPT
    # -----------------------------------------------------

    transcript = state.get(
        "transcript",
        ""
    )

    if not transcript:

        logger.warning(
            "NO TRANSCRIPT AVAILABLE. SKIPPING AUDIT"
        )

        return {
            "final_status": "FAIL",
            "compliance_results": [],
            "final_report": (
                "AUDIT SKIPPED BECAUSE VIDEO PROCESSING "
                "FAILED (NO TRANSCRIPT)"
            )
        }

    try:

        # =================================================
        # AZURE OPENAI CHAT MODEL
        # =================================================

        logger.info(
            "Initializing Azure OpenAI GPT-4o..."
        )

        llm = AzureChatOpenAI(
            azure_endpoint=os.getenv(
                "AZURE_OPENAI_ENDPOINT"
            ),
            api_key=os.getenv(
                "AZURE_OPENAI_API_KEY"
            ),
            azure_deployment=os.getenv(
                "AZURE_OPENAI_CHAT_DEPLOYMENT"
            ),
            api_version=os.getenv(
                "AZURE_OPENAI_API_VERSION"
            ),
            temperature=0.0
        )

        logger.info(
            "Azure OpenAI GPT-4o initialized."
        )

        # =================================================
        # AZURE OPENAI EMBEDDINGS
        # =================================================

        logger.info(
            "Initializing Azure OpenAI embeddings..."
        )

        embeddings = AzureOpenAIEmbeddings(
            azure_endpoint=os.getenv(
                "AZURE_OPENAI_ENDPOINT"
            ),
            api_key=os.getenv(
                "AZURE_OPENAI_API_KEY"
            ),
            azure_deployment=os.getenv(
                "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
                "text-embedding-3-small"
            ),
            api_version=os.getenv(
                "AZURE_OPENAI_API_VERSION"
            )
        )

        logger.info(
            "Azure OpenAI embeddings initialized."
        )

        # =================================================
        # AZURE AI SEARCH
        # =================================================

        logger.info(
            "Connecting to Azure AI Search..."
        )

        vector_store = AzureSearch(
            azure_search_endpoint=os.getenv(
                "AZURE_SEARCH_ENDPOINT"
            ),
            azure_search_key=os.getenv(
                "AZURE_SEARCH_API_KEY"
            ),
            index_name=os.getenv(
                "AZURE_SEARCH_INDEX_NAME"
            ),
            embedding_function=embeddings.embed_query
        )

        logger.info(
            "Azure AI Search connected."
        )

        # =================================================
        # PREPARE VIDEO CONTENT
        # =================================================

        ocr_text = state.get(
            "ocr_text",
            []
        )

        # Make OCR robust if it isn't a list
        if isinstance(ocr_text, str):
            ocr_text = [ocr_text]

        ocr_combined = " ".join(
            str(text)
            for text in ocr_text
        )

        query_text = (
            transcript
            + "\n"
            + ocr_combined
        )

        logger.info(
            "Performing RAG similarity search..."
        )

        # =================================================
        # RAG RETRIEVAL
        # =================================================

        docs = vector_store.similarity_search(
            query_text,
            k=3
        )

        logger.info(
            f"Retrieved {len(docs)} regulatory documents."
        )

        retrieved_rules = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        if not retrieved_rules:

            logger.warning(
                "No regulatory rules were retrieved."
            )

            retrieved_rules = (
                "No specific regulatory rules were retrieved "
                "from the knowledge base."
            )

        # =================================================
        # SYSTEM PROMPT
        # =================================================

        system_prompt = f"""
You are a senior brand compliance auditor.

Your task is to audit the supplied video content against
the official regulatory rules retrieved from the knowledge base.

OFFICIAL REGULATORY RULES:

{retrieved_rules}

---------------------------------------------------------
AUDIT INSTRUCTIONS
---------------------------------------------------------

Analyze:

1. Claims made in the video
2. Financial or promotional claims
3. Product/service claims
4. Intellectual property claims
5. Privacy or personal-data issues
6. Misleading statements
7. Missing disclosures
8. Regulatory violations
9. Any other issue supported by the retrieved rules

Only identify a violation when the video content provides
reasonable evidence for it.

Do not invent violations.

---------------------------------------------------------
REQUIRED OUTPUT
---------------------------------------------------------

Return ONLY valid JSON.

The JSON must follow exactly this structure:

{{
    "compliance_results": [
        {{
            "category": "Claim Validation",
            "severity": "CRITICAL",
            "description": "Explanation of the violation."
        }}
    ],
    "status": "FAIL",
    "final_report": "Summary of the compliance findings."
}}

If there are no violations, return:

{{
    "compliance_results": [],
    "status": "PASS",
    "final_report": "No compliance violations detected."
}}

Allowed severity values:

- CRITICAL
- MAJOR
- MINOR

Do not return Markdown.

Do not return ```json.

Do not return explanations outside the JSON object.
"""

        # =================================================
        # USER MESSAGE
        # =================================================

        user_message = f"""
VIDEO METADATA:

{state.get("video_metadata", {})}


VIDEO TRANSCRIPT:

{transcript}


ON-SCREEN TEXT (OCR):

{ocr_text}
"""

        # =================================================
        # CALL GPT-4o
        # =================================================

        logger.info(
            "Sending video content to GPT-4o for compliance audit..."
        )

        response = llm.invoke(
            [
                SystemMessage(
                    content=system_prompt
                ),
                HumanMessage(
                    content=user_message
                )
            ]
        )

        # =================================================
        # GET LLM RESPONSE
        # =================================================

        content = response.content

        # LangChain can theoretically return non-string
        # content, so normalize it.
        if not isinstance(content, str):
            content = str(content)

        content = content.strip()

        logger.info(
            "LLM response received successfully."
        )

        logger.info(
            f"Raw LLM response: {content}"
        )

        # =================================================
        # REMOVE MARKDOWN CODE FENCES
        # =================================================

        if "```" in content:

            match = re.search(
                r"```(?:json)?\s*(.*?)\s*```",
                content,
                re.DOTALL
            )

            if match:

                content = match.group(1).strip()

        # =================================================
        # HANDLE EXTRA TEXT AROUND JSON
        # =================================================

        # Find the first JSON object if GPT returns
        # accidental text before/after it.

        if not content.startswith("{"):

            start = content.find("{")

            end = content.rfind("}")

            if start != -1 and end != -1:

                content = content[
                    start:end + 1
                ]

        # =================================================
        # PARSE JSON
        # =================================================

        logger.info(
            "Parsing LLM compliance response..."
        )

        audit_data = json.loads(
            content
        )

        # =================================================
        # EXTRACT RESULTS
        # =================================================

        compliance_results = audit_data.get(
            "compliance_results",
            []
        )

        final_status = audit_data.get(
            "status",
            "FAIL"
        )

        final_report = audit_data.get(
            "final_report",
            "No report generated."
        )

        # =================================================
        # NORMALIZE STATUS
        # =================================================

        final_status = str(
            final_status
        ).upper()

        if final_status not in [
            "PASS",
            "FAIL"
        ]:

            final_status = "FAIL"

        # =================================================
        # LOG RESULTS
        # =================================================

        logger.info(
            "----------------------------------------"
        )

        logger.info(
            f"AUDIT STATUS: {final_status}"
        )

        logger.info(
            f"VIOLATIONS FOUND: "
            f"{len(compliance_results)}"
        )

        logger.info(
            "----------------------------------------"
        )

        # =================================================
        # RETURN RESULTS TO LANGGRAPH STATE
        # =================================================

        return {
            "compliance_results": compliance_results,
            "final_status": final_status,
            "final_report": final_report
        }

    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except json.JSONDecodeError as e:

        logger.error(
            f"Failed to parse LLM JSON response: {e}"
        )

        logger.error(
            f"Raw LLM response: "
            f"{response.content if 'response' in locals() else 'None'}"
        )

        return {
            "errors": [
                f"Invalid JSON returned by LLM: {str(e)}"
            ],
            "compliance_results": [],
            "final_status": "FAIL",
            "final_report": (
                "AUDIT FAILED BECAUSE THE LLM "
                "RETURNED INVALID JSON."
            )
        }

    except Exception as e:

        logger.error(
            f"System Error in Auditor Node: {e}"
        )

        logger.error(
            f"Raw LLM response: "
            f"{response.content if 'response' in locals() else 'None'}"
        )

        return {
            "errors": [
                str(e)
            ],
            "compliance_results": [],
            "final_status": "FAIL",
            "final_report": (
                "AUDIT FAILED DURING "
                "COMPLIANCE ANALYSIS."
            )
        }