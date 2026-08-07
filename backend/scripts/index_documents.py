import os
import glob
import logging 
from dotenv import load_dotenv
load_dotenv(override=True)

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_community.vectorstores import AzureSearch
from langchain_openai import AzureOpenAIEmbeddings



#setting up logging
logging.basicConfig(
    level = logging.INFO,
    format = "%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("indexer")

def index_docs():
    '''
        READS THE PDF'S , CHUNKS THEM , AND UPLOADS THEM TO AZURE AI AzureSearch
    '''

    #define paths , we look for data folders 
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_folder = os.path.join(current_dir,"../../backend/data")

    #check the environment variables
    logger.info("="*60)
    logger.info("Environment Configuration Check:")
    logger.info(f"AZURE_OPENAI_ENDPOINT : {os.getenv('AZURE_OPENAI_ENDPOINT')}")
    logger.info(f"AZURE_OPENAI_API_VERSION : {os.getenv('AZURE_OPENAI_API_VERSION')}")
    logger.info(f"Embedding Deployment : {os.getenv('AZURE_OPENAI_EMBEDDING_DEPLOYMENT' , ' text-embedding-3-small')}")
    logger.info(f"AZURE_SEARCH_ENDPOINT : {os.getenv('AZURE_SEARCH_ENDPOINT')}")
    logger.info(f"AZURE_SEARCH_INDEX_NAME : {os.getenv('AZURE_SEARCH_INDEX_NAME')}")
    logger.info("="*60)

    required_vars =[
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_API_KEY",
        "AZURE_SEARCH_INDEX_NAME"
    ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables : {missing_vars}")
        logger.error("PLEASE CHECK YOUR .ENV FILE AND ENSURE ALL THE VARIABLES ARE SET ")
        return

    #initialize embedding model
    try:
        logger.info("initializing Azure OpenAI Embeddings.....")
        embeddings = AzureOpenAIEmbeddings(
            azure_deployment = os.getenv('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', 'text-embedding-3-small'),
            azure_endpoint = os,getenv("AZURE_OPENAI_ENDPOINT"),
            api_key = os.getenv("AZURE_OPENAI_API_KEY"),
            openai_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "----------DATE OF MY  API KEY LIKE ["2024-02-01"]---------- "),

        )
        logger.info("Embeddings models initialized successfully")
    except Exception as e :
        logger.error(f"Failed to initialize embeddings : {e}")
        logger.error("Please verify your azure openai deployment name and endpoint ")
        return 


    #initializing the azure AzureSearch
    try:
        logger.info("initializing Azure AI Search  vector  store .....")
        embeddings = AzureOpenAIEmbeddings(
            azure_search_endpoint = os.getenv('AZURE_SEARCH_ENDPOINT'),
            azure_search_key  = os,getenv("AZURE_SEARCH_API_KEY"),
            index_name = index_name ,
            embedding_function = embeddings.embed_query,
        )
        logger.info(f'Vector store initialized for index : {index_name}')
    except Exception as e :
        logger.error(f"Failed to initialize Azure Search: {e}")
        logger.error("Please verify your azure search endpoint , API key and Index name ")
        return 

    #Find Pdf files 
    pdf_files = glob.glob(os.path.join(data_folder,"*.pdf"))
    if not pdf_files :
        logger.warning(f"No pdfs found in {data_folder}. Please add files ")
    logger.info(f"Found {len(pdf_files)} PDF'S tp process : {[os.path.basename(f) for f in pdf_files]}")

    all_splits = []

    #process each pdf 
    for pdf_path in pdf_files:
        try :
            logger.info(f"loading:{os.path.basename(pdf_path)}......")
            loader = PyPDFLoader(pdf_path)
            raw_docs =loader.load()

            # chunking strategy
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size =1000,
                chunk_overlap = 200

            )

            splits = text_splitter.split_documents(raw_docs)
            for splits in splits :
                splits.metadata["source"] = os.path.basename(pdf_path)

            all_splits.extend(splits)
            logger.info(f"Splits into {len(splits)} chunks ")

        except Exception as e:
            logger.error(f"failed to process {pdf_path} : {e}")

        if all_splits:
            logger.info(f"Uploading {len(all_splits)} chunks to Azure AI search Index '{index_name}' ")
            try :
                #azure search accepts batches automatically via this method 
                vector_store.add_documents(documents = all_splits)
                logger.info("="*60)
                logger.info("indexing complete ! Knowledge Base is ready..")
                logger.info(f"Total chunks indexed: {len(all_splits)} ")
                logger.info("="*60)
            except Exception as e :
                logger.error(f"Failed to upload the documents to Azure Search : {e}")
                logger.error("Pleaase check the Azure Search Configuration and try Again")
        else :
            logger.warning("No Document were Processed")


if __name__ = "__main__" :
    index_docs
