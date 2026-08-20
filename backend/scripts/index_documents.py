import os
import glob
import logging

from dotenv import load_dotenv

load_dotenv(override=True)

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import AzureSearch
from langchain_openai import AzureOpenAIEmbeddings


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("indexer")


def index_docs():
    """
    Read PDFs, split them into chunks, generate embeddings,
    and upload them to Azure AI Search.
    """

    # -----------------------------------------------------
    # Paths
    # -----------------------------------------------------

    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_folder = os.path.abspath(
        os.path.join(current_dir, "../data")
    )

    # -----------------------------------------------------
    # Environment configuration
    # -----------------------------------------------------

    logger.info("=" * 60)
    logger.info("Environment Configuration Check:")
    logger.info(
        f"AZURE_OPENAI_ENDPOINT : "
        f"{os.getenv('AZURE_OPENAI_ENDPOINT')}"
    )
    logger.info(
        f"AZURE_OPENAI_API_VERSION : "
        f"{os.getenv('AZURE_OPENAI_API_VERSION')}"
    )
    logger.info(
        f"Embedding Deployment : "
        f"{os.getenv('AZURE_OPENAI_EMBEDDING_DEPLOYMENT')}"
    )
    logger.info(
        f"AZURE_SEARCH_ENDPOINT : "
        f"{os.getenv('AZURE_SEARCH_ENDPOINT')}"
    )
    logger.info(
        f"AZURE_SEARCH_INDEX_NAME : "
        f"{os.getenv('AZURE_SEARCH_INDEX_NAME')}"
    )
    logger.info("=" * 60)

    required_vars = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_API_KEY",
        "AZURE_SEARCH_INDEX_NAME"
    ]

    missing_vars = [
        var for var in required_vars
        if not os.getenv(var)
    ]

    if missing_vars:
        logger.error(
            f"Missing required environment variables: {missing_vars}"
        )
        return

    # -----------------------------------------------------
    # Search index name
    # -----------------------------------------------------

    index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")

    logger.info(
        f"Using Azure AI Search index: {index_name}"
    )

    # -----------------------------------------------------
    # Initialize Azure OpenAI embeddings
    # -----------------------------------------------------

    try:

        logger.info(
            "Initializing Azure OpenAI Embeddings..."
        )

        embeddings = AzureOpenAIEmbeddings(
            azure_deployment=os.getenv(
                "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
            ),
            azure_endpoint=os.getenv(
                "AZURE_OPENAI_ENDPOINT"
            ),
            api_key=os.getenv(
                "AZURE_OPENAI_API_KEY"
            ),
            api_version=os.getenv(
                "AZURE_OPENAI_API_VERSION",
                "2025-04-01-preview"
            ),
        )

        logger.info(
            "Embedding model initialized successfully."
        )

    except Exception as e:

        logger.error(
            f"Failed to initialize embeddings: {e}"
        )

        return

    # -----------------------------------------------------
    # Initialize Azure AI Search
    # -----------------------------------------------------

    try:

        logger.info(
            "Initializing Azure AI Search vector store..."
        )

        vector_store = AzureSearch(
            azure_search_endpoint=os.getenv(
                "AZURE_SEARCH_ENDPOINT"
            ),
            azure_search_key=os.getenv(
                "AZURE_SEARCH_API_KEY"
            ),
            index_name=index_name,
            embedding_function=embeddings.embed_query,
        )

        logger.info(
            f"Vector store initialized for index: "
            f"{index_name}"
        )

    except Exception as e:

        logger.error(
            f"Failed to initialize Azure Search: {e}"
        )

        return

    # -----------------------------------------------------
    # Find PDFs
    # -----------------------------------------------------

    pdf_files = glob.glob(
        os.path.join(data_folder, "*.pdf")
    )

    if not pdf_files:

        logger.warning(
            f"No PDFs found in {data_folder}"
        )

        return

    logger.info(
        f"Found {len(pdf_files)} PDF(s) to process:"
    )

    for pdf in pdf_files:
        logger.info(
            f"  - {os.path.basename(pdf)}"
        )

    # -----------------------------------------------------
    # Process PDFs
    # -----------------------------------------------------

    all_splits = []

    for pdf_path in pdf_files:

        try:

            logger.info(
                f"Loading: {os.path.basename(pdf_path)}"
            )

            loader = PyPDFLoader(pdf_path)

            raw_docs = loader.load()

            # ---------------------------------------------
            # Chunking
            # ---------------------------------------------

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )

            splits = text_splitter.split_documents(
                raw_docs
            )

            # ---------------------------------------------
            # Add source metadata
            # ---------------------------------------------

            for split in splits:

                split.metadata["source"] = (
                    os.path.basename(pdf_path)
                )

            all_splits.extend(splits)

            logger.info(
                f"Split into {len(splits)} chunks."
            )

        except Exception as e:

            logger.error(
                f"Failed to process {pdf_path}: {e}"
            )

    # -----------------------------------------------------
    # Upload documents
    # -----------------------------------------------------

    if not all_splits:

        logger.warning(
            "No documents were processed."
        )

        return

    logger.info(
        f"Uploading {len(all_splits)} chunks "
        f"to Azure AI Search index '{index_name}'..."
    )

    try:

        vector_store.add_documents(
            documents=all_splits
        )

        logger.info("=" * 60)
        logger.info(
            "INDEXING COMPLETE!"
        )
        logger.info(
            f"Total chunks indexed: {len(all_splits)}"
        )
        logger.info("=" * 60)

    except Exception as e:

        logger.error(
            f"Failed to upload documents to Azure Search: {e}"
        )

        return


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

if __name__ == "__main__":
    index_docs()