import traceback
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


def make_safe_node(fn, name: str):
    """Wrap any agent node so errors don't crash the whole graph — they get logged."""
    def safe_fn(state: AgentState) -> AgentState:
        errors = list(state.get("errors", []))
        try:
            print(f"[Pipeline] ▶ Running {name}...")
            result = fn(state)
            print(f"[Pipeline] ✓ {name} completed")
            return result
        except Exception as e:
            tb = traceback.format_exc()
            err_msg = f"{name} CRASHED: {str(e)}"
            print(f"[Pipeline] ✗ {err_msg}\n{tb}")
            errors.append(err_msg)
            return {**state, "errors": errors}
    safe_fn.__name__ = name
    return safe_fn


def build_screening_pipeline() -> StateGraph:
    """
    Assemble the HireFlow agentic screening pipeline with per-node error safety.

    Flow:
    resume_parser → criteria_extractor → bias_guardrail
      → skill_matcher → experience_agent → project_evaluator
      → evidence_agent → ranking_agent → audit_agent → END
    """
    graph = StateGraph(AgentState)

    # Register all agents as safe nodes (won't crash graph on individual failures)
    graph.add_node("resume_parser",      make_safe_node(resume_parser_agent,      "ResumeParser"))
    graph.add_node("criteria_extractor", make_safe_node(criteria_extractor_agent, "CriteriaExtractor"))
    graph.add_node("bias_guardrail",     make_safe_node(bias_guardrail_agent,     "BiasGuardrail"))
    graph.add_node("skill_matcher",      make_safe_node(skill_matcher_agent,      "SkillMatcher"))
    graph.add_node("experience_agent",   make_safe_node(experience_agent,         "ExperienceAgent"))
    graph.add_node("project_evaluator",  make_safe_node(project_evaluator_agent,  "ProjectEvaluator"))
    graph.add_node("evidence_agent",     make_safe_node(evidence_agent,           "EvidenceAgent"))
    graph.add_node("ranking_agent",      make_safe_node(ranking_agent,            "RankingAgent"))
    graph.add_node("audit_agent",        make_safe_node(audit_agent,              "AuditAgent"))

    # Wire sequential pipeline
    graph.set_entry_point("resume_parser")
    graph.add_edge("resume_parser",      "criteria_extractor")
    graph.add_edge("criteria_extractor", "bias_guardrail")
    graph.add_edge("bias_guardrail",     "skill_matcher")
    graph.add_edge("skill_matcher",      "experience_agent")
    graph.add_edge("experience_agent",   "project_evaluator")
    graph.add_edge("project_evaluator",  "evidence_agent")
    graph.add_edge("evidence_agent",     "ranking_agent")
    graph.add_edge("ranking_agent",      "audit_agent")
    graph.add_edge("audit_agent",        END)

    return graph.compile()


# Singleton compiled pipeline
screening_pipeline = build_screening_pipeline()
print("[Pipeline] HireFlow AI Screening Pipeline compiled successfully ✓")
