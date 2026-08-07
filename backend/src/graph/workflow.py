'''
    THIS MODULE DEFINES THE DAG : DIRECTED ACYCLIC GRAPH THAT ORCHESTRATES THE VIDEO COMPLIANCE AUDIT PROCESS 
    IT CONNECTS THE NODES USING THE STATEGRAPH FROM LANGGRAPH

    START -> INDEX_VIDEO_NODE -AUDIT_CONTENT_NODES -> END 
'''

from langgraph.graph import StateGraph , END
from backend.src.graph.state import VideoAuditState
from backend.src.graph.nodes import(
    index_video_node,
    audit_content_node 
)

def create_graph():
    '''
        consttructs and compiles the LangGraph workflow
        returns :
        compiled Graph : runnable graph object 
    ''' 

    #initial the graph with state schema 
    workflow = StateGraph(VideoAuditState)
    
    #add the node 
    workflow.add_node("indexer",index_video_node)
    workflow.add_node("auditor",audit_content_node)
    
    #define entry points 
    workflow.set_entry_point("indexer")

    #define the edges
    workflow.add_edge("indexer","auditor")

    workflow.add_edge("auditor",END)

    app = workflow.compile()
    return app

app = create_graph()

