import React from 'react';
import _ from 'lodash';

import {EditorView, PluginValue, ViewUpdate, ViewPlugin, Decoration} from "@codemirror/next/view";
import {EditorState} from "@codemirror/next/state";
import {RangeSetBuilder, RangeSet} from "@codemirror/next/rangeset";
import {defaultHighlighter} from "@codemirror/next/highlight";

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialProps, make_multiple_trials, ValueInput, ProgressBar} from '../common';
import {AnswerBar, sample_criterion} from './function_basic';

interface TrialData {
  program: string
  call: string
  answer: string
}

class LineBlur implements PluginValue {
  decorations: RangeSet<Decoration>

  constructor(program: string, on_hover: (ref: number) => void) {
    let builder = new RangeSetBuilder<Decoration>();
    let idx = 0;
    program.split('\n').forEach((line, i) => {
      let length = line.length + 1;
      let mark = Decoration.mark({
        tagName: 'span', class: 'blur-line', attributes: {onmouseover: `window.line_hover(${i})`}
      });
      builder.add(idx + 3, idx + length, mark);
      idx += length;
    });
    this.decorations = builder.finish();

    (window as any).line_hover = (i: number) => on_hover(i);
  }

  update(update: ViewUpdate) {
    // pass
  }
}

class TrialView extends React.Component<TrialProps<TrialData>> {
  telemetry: any[] = []
  editor_ref = React.createRef<HTMLDivElement>()
  start_time = 0

  add_telemetry(action: string, target: string) {
    this.telemetry.push({
      action, target,
      timestamp: Date.now() - this.start_time
    });
  }

  render_editor() {
    let program = this.props.trial.program;

    let on_hover = (i: number) => {
      this.add_telemetry('hover', i.toString());
      console.log(this.telemetry);
    };

    let extensions = [
      EditorView.editable.of(false),
      ViewPlugin.define((_: any) => new LineBlur(program, on_hover)).decorations()
    ];

    let state = EditorState.create({doc: program, extensions});
    let view = new EditorView({state});

    let node = this.editor_ref.current!;
    node.innerHTML = '';
    node.appendChild(view.dom);
  }

  componentDidMount() {
    this.render_editor();
    this.start_time = Date.now();
  }

  componentDidUpdate() {
    this.render_editor();
  }

  render() {
    return <div>
      <div>
        <div className='editor'>
          <div ref={this.editor_ref} />
        </div>
      </div>
      <hr />
      <AnswerBar answer={this.props.trial.answer} answer_time={2} timeout={90}
                 finished={(response: any) => this.props.finished({
                   telemetry: this.telemetry, ...response})}
                 check_answer={(answer: string) => answer == this.props.trial.answer}
                 call={this.props.trial.call} />
    </div>
  }
}

export let Experiment = make_multiple_trials<TrialData>(TrialView);


let trial_data: TrialData = {
  'program': 'n = 1 + 7\nd = 1 + 5\nv = 4 + n\nz = v - d\nm = z + 4',
  'call': 'm',
  'answer': '10'
}

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>These programs will be presented in an unfamiliar way. The right hand side of each variable assignment will be blurred out. You must move your mouse over the line of code to see its contents. Try out a sample:</p>

    <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion} trial_data={trial_data} />
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
