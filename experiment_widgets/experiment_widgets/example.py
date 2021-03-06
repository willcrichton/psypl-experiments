#!/usr/bin/env python
# coding: utf-8

# Copyright (c) .
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode
from ._frontend import module_name, module_version

class ExperimentWidget(DOMWidget):
    _model_name = Unicode('ExperimentModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('ExperimentWidget').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_version = Unicode(module_version).tag(sync=True)

    experiment_name = Unicode('').tag(sync=True)
    experiment_data = Unicode('').tag(sync=True)
    results = Unicode('').tag(sync=True)

# class VariableMemoryExperiment(BaseWidget):
#     _view_name = Unicode('VariableMemoryView').tag(sync=True)

# class VariableArithmeticMemoryExperiment(BaseWidget):
#     _view_name = Unicode('VariableArithmeticMemoryView').tag(sync=True)

# class VariableArithmeticSequenceExperiment(BaseWidget):
#     _view_name = Unicode('VariableArithmeticSequenceView').tag(sync=True)

# class VariableTracingExperiment(BaseWidget):
#     _view_name = Unicode('VariableTracingView').tag(sync=True)

# class VariableTracingHardExperiment(BaseWidget):
#     _view_name = Unicode('VariableTracingHardView').tag(sync=True)

# class VariableCuedRecallExperiment(BaseWidget):
#     _view_name = Unicode('VariableCuedRecallView').tag(sync=True)

# class FunctionBasicExperiment(BaseWidget):
#     _view_name = Unicode('FunctionBasicView').tag(sync=True)

# class TracingExternalExperiment(BaseWidget):
#     _view_name = Unicode('TracingExternalView').tag(sync=True)

# class FunctionMemoryExperiment(BaseWidget):
#     _view_name = Unicode('FunctionMemoryView').tag(sync=True)

# class TracingStrategyExperiment(BaseWidget):
#     _view_name = Unicode('TracingStrategyView').tag(sync=True)

# class HofQuizExperiment(BaseWidget):
#     _view_name = Unicode('HofQuizView').tag(sync=True)

# class WriteProgramsExperiment(BaseWidget):
#     _view_name = Unicode('WriteProgramsView').tag(sync=True)

# class WriteProgramsExperiment(BaseWidget):
#     _view_name = Unicode('WriteProgramsView').tag(sync=True)
