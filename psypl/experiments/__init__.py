from .function_align import FunctionAlignExperiment
from .function_args import FunctionArgsExperiment
from .function_basic import FunctionBasicExperiment
from .function_depth import FunctionDepthExperiment
from .variable_arithmetic import VariableArithmeticExperiment
from .variable_cued_recall import VariableCuedRecallExperiment
from .variable_sequence import VariableSequenceExperiment
from .variable_span import VariableSpanExperiment

EXPERIMENTS = [
    FunctionAlignExperiment,
    FunctionArgsExperiment,
    FunctionBasicExperiment,
    FunctionDepthExperiment,
    VariableArithmeticExperiment,
    VariableSequenceExperiment,
    VariableCuedRecallExperiment,
    VariableSpanExperiment
]
