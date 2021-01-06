from .function_align import FunctionAlignExperiment
from .function_args import FunctionArgsExperiment
from .function_basic import FunctionBasicExperiment
from .function_depth import FunctionDepthExperiment
from .variable_arithmetic import VariableArithmeticExperiment
from .variable_cued_recall import VariableCuedRecallExperiment
from .variable_arithmetic_sequence import VariableArithmeticSequenceExperiment
from .variable_span import VariableSpanExperiment
from .semantic_names import SemanticNamesExperiment
from .variable_distance import VariableDistanceExperiment
from .variable_count import VariableCountExperiment
from .tracing_external import TracingExternalExperiment
from .function_memory import FunctionMemoryExperiment
from .tracing_strategy import TracingStrategyExperiment
from .tracing_strategy_semantic import TracingStrategySemanticExperiment
from .hof_quiz import HofQuizExperiment

EXPERIMENTS = [
    FunctionAlignExperiment,
    FunctionArgsExperiment,
    FunctionBasicExperiment,
    FunctionDepthExperiment,
    VariableArithmeticExperiment,
    VariableArithmeticSequenceExperiment,
    VariableCuedRecallExperiment,
    VariableSpanExperiment,
    SemanticNamesExperiment,
    VariableDistanceExperiment,
    VariableCountExperiment,
    FunctionMemoryExperiment,
    TracingStrategyExperiment,
    TracingStrategySemanticExperiment,
    HofQuizExperiment
]
