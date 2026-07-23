from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.resume_parser import resume_parser_agent
from agents.criteria_extractor import criteria_extractor_agent
from agents.bias_guardrail import bias_guardrail_agent
from agents.skill_matcher import skill_matcher_agent
from agents.experience_agent import experience_agent
from agents.project_evaluator import project_evaluator_agent
from agents.evidence_agent import evidence_agent
from agents.ranking_agent import ranking_agent
from agents.audit_agent import audit_agent


def build_screening_pipeline() -> StateGraph:
    """
    Assemble the full HireFlow agentic screening pipeline as a LangGraph StateGraph.

    Flow:
    resume_parser → criteria_extractor → bias_guardrail
      → skill_matcher → experience_agent → project_evaluator
      → evidence_agent → ranking_agent → audit_agent → END
    """
    graph = StateGraph(AgentState)

    # Register all agents as nodes
    graph.add_node("resume_parser", resume_parser_agent)
    graph.add_node("criteria_extractor", criteria_extractor_agent)
    graph.add_node("bias_guardrail", bias_guardrail_agent)
    graph.add_node("skill_matcher", skill_matcher_agent)
    graph.add_node("experience_agent", experience_agent)
    graph.add_node("project_evaluator", project_evaluator_agent)
    graph.add_node("evidence_agent", evidence_agent)
    graph.add_node("ranking_agent", ranking_agent)
    graph.add_node("audit_agent", audit_agent)

    # Wire edges (sequential pipeline)
    graph.set_entry_point("resume_parser")
    graph.add_edge("resume_parser", "criteria_extractor")
    graph.add_edge("criteria_extractor", "bias_guardrail")
    graph.add_edge("bias_guardrail", "skill_matcher")
    graph.add_edge("skill_matcher", "experience_agent")
    graph.add_edge("experience_agent", "project_evaluator")
    graph.add_edge("project_evaluator", "evidence_agent")
    graph.add_edge("evidence_agent", "ranking_agent")
    graph.add_edge("ranking_agent", "audit_agent")
    graph.add_edge("audit_agent", END)

    return graph.compile()


# Singleton compiled pipeline
screening_pipeline = build_screening_pipeline()
