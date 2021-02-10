import React, {useState, useEffect, FunctionComponent} from 'react';
import ReactDOM from 'react-dom';
import {Sequence, SequenceChildProps as SeqProps} from 'react-sequence-typed';
import axios from 'axios';
import '../css/widget.scss';

import {Experiment, instruction_params} from 'experiment';
import {Instructions, InstructionParamsContext} from './instructions';
import {ValueInput, ShowAnswersContext, ProgressBar, ExperimentContext} from './common';

const BASE_URL = 'https://mindover.computer/api';
declare var EXPERIMENT_NAME: string;
declare var EXPERIMENT_MTURK: boolean;
declare var EXPERIMENT_IRB: boolean;
declare var EXPERIMENT_DEMOGRAPHICS: boolean;
declare var EXPERIMENT_NO_INSTRUCTIONS: boolean;

export function get_experiment(): Promise<any> {
  return axios.get(
    `${BASE_URL}/generate_experiment`,
    {params: {experiment: EXPERIMENT_NAME}}
  );
}

export function record_results(data: any) {
  return axios.post(`${BASE_URL}/record_results`, data);
}

let NameForm = (props: {next: (name: string) => void}) => {
  return <div>
    <div>Input your name, then press enter:</div>
    <input
      type="text"
      autoFocus={true}
      onKeyPress={(e) => {
        if (e.key == 'Enter') {
          props.next((e.target as HTMLInputElement).value);
        }}} />
  </div>;
};

let ConsentForm = (props: SeqProps) => {
  return <div>
    <h1>Research Consent Form</h1>
    <p><strong>DESCRIPTION:</strong> You are invited to participate in a research study about how memory affects program comprehension. You will complete a sequence of memory-related tasks involving mentally computing the output of a program.</p>
    <p><strong>TIME INVOLVEMENT:</strong> Your participation will take between 15 and 30 minutes.</p>
    <p><strong>RISKS AND BENEFITS:</strong> There are no risks associated with this study.  We cannot and do not guarantee or promise that you will receive any benefits (besides compensation) from this study.</p>
    <p><strong>PAYMENTS:</strong> You will be paid for your participation in this study.</p>
    <p><strong>PARTICIPANT’S RIGHTS:</strong> If you have read this form and have decided to participate in this project, please understand your participation is voluntary and you have the right to withdraw your consent or discontinue participation at any time without penalty or loss of benefits to which you are otherwise entitled.  The alternative is not to participate.  You have the right to refuse to answer particular questions.  The results of this research study may be presented at scientific or professional meetings or published in scientific journals.  Your individual privacy will be maintained in all published and written data resulting from the study.</p>
    <p><strong>CONTACT INFORMATION:</strong><br />
      <strong>Questions:</strong> If you have any questions, concerns or complaints about this research, its procedures, risks and benefits, contact the Protocol Director, Will Crichton at wcrichto@cs.stanford.edu or 515-314-9085.<br /><br />
      <strong>Independent Contact:</strong> If you are not satisfied with how this study is being conducted, or if you have any concerns, complaints, or general questions about the research or your rights as a participant, please contact the Stanford Institutional Review Board (IRB) to speak to someone independent of the research team at 650-723-2480 or email at IRB2-Manager@lists.stanford.edu, or toll free at 1-866-680-2906.  You can also write to the Stanford IRB, Stanford University, 1705 El Camino Real, Palo Alto, CA 94306.
    </p>
    <p>Please print a copy of this page for your records.</p>
    <p>
      <button className='primary' onClick={props.next}>If you agree to participate in this research, click here to continue.</button>
    </p>
  </div>;
}

interface QuestionProps {
  name: string
  answer: number
  attempt: number
  set_correct: (correct: boolean) => void
}

let Question: FunctionComponent<QuestionProps> = (props) => {
  let [answer, set_answer] = useState('');
  let correct = parseInt(answer) == props.answer;
  let input_ref = React.createRef<HTMLInputElement>();
  useEffect(() => { set_answer(input_ref.current!.value); }, [props.attempt]);

  return <p>
    <strong>Question {props.name}:</strong> {props.children}
    <strong>Answer: </strong>
    <ShowAnswersContext.Provider value={false}>
      <ValueInput
        input_ref={input_ref}
        onChange={(s) => props.set_correct(parseInt(s) == props.answer)}
        correct={props.attempt > 0 ? correct : undefined} />
    </ShowAnswersContext.Provider>
  </p>
}

let PRETESTS = {
  Python: [
    {question: <>
      <span>what is the value of <code>z</code> in the following program?</span>
      <pre>{`def f(w, q):
  return q - w

x = 1
z = f(x, 3)`}</pre>
    </>,
     answer: 2},

    {question: <>
      <span>if we call function <code>c()</code>, how many times is the function <code>a()</code> called?</span>
      <pre>{`def a():
  return 1
def b():
  return a() + a()
def c():
  return b() + b()`}</pre>
    </>,
     answer: 4}
  ],

  Java: [
    {question: <>
      <span>what is the final value of <code>x</code> in the following program?</span>
      <pre>{`
List<int> l = Arrays.asList(5, 2, 1, 6);
int x = 0;
for (int n : l) {
  if (n % 2 == 0) {
    x += n;
  }
}
`}</pre>
    </>,
     answer: 8},

    {question: <>
      <span>how many public methods does does the class `C` contain?</span>
      <pre>{`
interface A {
  public void foo();
}

class B {
  public void bar() {}
  public void baz() {}
}

class C extends B implements A {
  public void foo() {}
  public void quux() {}
}
        `}
      </pre>
    </>,
     answer: 4}
  ]
};

let PRETEST_LANGUAGE = "Java";

let Pretest = (props: SeqProps) => {
  let [attempt, set_attempt] = useState(0);
  let [correct, set_correct] = useState([false, false]);
  let [last_correct, set_last_correct] = useState([false, false]);

  let check_answers = () => {
    if (correct[0] && correct[1]) {
      setTimeout(props.next, 3000);
    }
    set_last_correct(correct);
    set_attempt(attempt + 1);
  };

  let onto_next_stage = attempt > 0 && last_correct[0] && last_correct[1];

  return <div>
    <h1>{PRETEST_LANGUAGE} Pretest</h1>
    <p>For this experiment, we require that you understand basic {PRETEST_LANGUAGE} programs (as said in the title and description of the HIT). You need to correctly answer the following two questions. Both answers are a one-digit number.</p>
    { attempt > 1 && !(last_correct[0] && last_correct[1])
      ? <p><strong>You did not pass the pretest. Please return the HIT.</strong></p>
      : <>
        {PRETESTS[PRETEST_LANGUAGE].map((({question, answer}, i) =>
          <Question name={i+1} answer={answer} attempt={attempt} set_correct={(c) => {
            correct[i] = c;
            set_correct(correct)
          }}>{question}</Question>
        ))}
        <button className='primary' onClick={check_answers} disabled={onto_next_stage}>Submit answers</button>
        {onto_next_stage
                 ? <p><strong>You passed the pre-test. Proceeding to the experiment... <ProgressBar duration={3000} /></strong></p>
                 : (attempt == 1
                  ? <p><strong>At least one answer was incorrect. You may try once more to correct your response.</strong></p>
                  : null)}
      </>}

  </div>
};

let Demographics = (props: {save_demographics: (data: any) => void}) => {
  let [age, set_age] = useState<string|null>(null);
  let [experience, set_experience] = useState<string|null>(null);
  let save = () => {
    if (age == null || experience == null) {
      alert("Please answer both questions before proceeding.");
    } else {
      props.save_demographics({age, experience});
    }
  };

  return <div>
    <h1>Demographic information</h1>
    <p>Please answer the following questions so we can understand your background.</p>
    <p>
      <strong>What is your age?</strong>
      {["<20", "20-29", "30-39", "40-49", "50+"].map((label) =>
        <div><input type="radio" name="age" onChange={() => set_age(label)} /> {label}</div>)}
    </p>
    <p>
      <strong>How many years of programming experience do you have?</strong><br />
      {["<1", "1-2", "3-4", "5+"].map((label) =>
        <div><input type="radio" name="experience" onChange={() => set_experience(label)} /> {label}</div>)}
    </p>
    <button className='primary' onClick={save}>Next</button>
  </div>
};

let ThankYou = (props: SeqProps) => {
  return <div>
    <p>The experiment is complete. Thank you for your participation!</p>
    {EXPERIMENT_MTURK
    ? <p><input type="submit" value="Click here to conclude the HIT"/></p>
    : <p>You may close this window now.</p>}
  </div>
};


let participant: string | null;
const url_params = new URLSearchParams(window.location.search);
if (EXPERIMENT_MTURK) {
  participant = `mturk-${url_params.get('workerId')}`;
} else {
  participant = null;
}


class ExperimentContainer extends React.Component {
  state = { participant, experiment: null, demographics: null, finished: false, start: Date.now(), error: false }
  results: any[] = []

  componentDidMount() {
    get_experiment()
      .then(({data}) => this.setState({experiment: data}))
      .catch((_) => this.setState({error: true}));

    if (EXPERIMENT_MTURK) {
      const form = document.getElementById('mturk_form')!;
      form.onsubmit = () => {
        return this.state.finished;
      }
    }
  }

  save_results() {
    let data: any = {
      experiment: EXPERIMENT_NAME,
      description: this.state.experiment!,
      participant: this.state.participant!,
      results: this.results,
      demographics: this.state.demographics,
      duration: Date.now() - this.state.start
    };
    if (EXPERIMENT_MTURK) {
      data.hit_id = url_params.get('hitId');
      data.assignment_id = url_params.get('assignmentId');
    }
    record_results(data);
    this.setState({finished: true});
  }

  render() {
    return <ExperimentContext.Provider value={this.state.experiment}>
      <InstructionParamsContext.Provider value={instruction_params}>
        <div className='experiment'>
          {this.state.error
          ? <div>Sorry, an error has occurred. Please return the HIT and email <a href="mailto:wcrichto@cs.stanford.edu">wcrichto@cs.stanford.edu</a>.</div>
          :
           (this.state.participant == null
          ? <NameForm next={(name: string) => {
            this.setState({participant: name});
          }} />
          : <Sequence>
            {EXPERIMENT_IRB ? ConsentForm : null}

            {EXPERIMENT_MTURK ? Pretest : null}

            {EXPERIMENT_DEMOGRAPHICS ? ((props: SeqProps) =>
              <Demographics save_demographics={(data) => {
                this.setState({demographics: data});
                props.next()
              }} />) :
             null }

            {!EXPERIMENT_NO_INSTRUCTIONS ? (props: SeqProps) =>
              <Instructions start={props.next} />
              : null}

            {(props: SeqProps) => <Experiment
                                   save_results={(results: any) => {this.results.push(results);}}
                                   on_finished={() => { this.save_results(); props.next(); }}
                                   {...this.state.experiment!} />}

            {(props: SeqProps) => <ThankYou {...props} />}
          </Sequence>)}
        </div>
      </InstructionParamsContext.Provider>
    </ExperimentContext.Provider>;
  }
}

ReactDOM.render(<ExperimentContainer />, document.getElementById('experiment-container'));
