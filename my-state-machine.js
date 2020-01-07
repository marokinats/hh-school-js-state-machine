let contextStore = [];

class StateMachine {

  constructor(machineParams) {
    this.machineParams = machineParams;
    this.states = machineParams.states;
    this.initialState = machineParams.initialState;
  }

  transition(transaction, event) {
    const onTransaction = this.states[this.initialState].on[transaction];

    if (onTransaction.service) {
      this.stateAction(onTransaction.service, event);
    } else {
      const [state, setState] = useState();
      setState();
    }
  }

  stateAction(toDoAction, event = null) {

    if (typeof toDoAction === 'function') {
      contextStore.push({ machine: this });
      toDoAction(event);
      contextStore.pop();
    }
    else if (typeof toDoAction === 'string') {
      this.machineParams.actions[toDoAction]();
    }
    else if (Array.isArray(toDoAction)) {
      toDoAction.forEach(el => {
        this.actions[el]();
      });
    }
    else if (typeof toDoAction === 'object') {
      for (const key in toDoAction) {
        this.stateAction(toDoAction[key], event);
      }
    }
  }
}


function useContext() {
  const [machine] = [contextStore[contextStore.length - 1].machine];

  let currentContext = machine.machineParams.context;

  setContext = (newContext) => {
    if (newContext) {
      for (const key in newContext) {
        currentContext[key] = newContext[key];
      }
    }

  }

  return [currentContext, setContext];
};

function useState() {
  const [machine] = [contextStore[contextStore.length - 1].machine];

  setState = (newState) => {
    let OnExitAction = machine.states[machine.initialState].onExit;
    
    if (OnExitAction) {
      machine.stateAction(OnExitAction);
    }

    if (newState) {
      machine.initialState = newState;
    }
    else {
      for (const key in machine.states) {
        if (key != machine.initialState) {
          machine.initialState = machine.states[key];
        }
      }
    }

    machine.stateAction(machine.states[machine.initialState]);
  }

  return [machine.initialState, setState];
};

const machine = function (machineParams) {

  return new StateMachine(machineParams);
};


const negotiationsMachine = machine({
  initialState: 'none',
  context: {},
  states: {
    letter: {},
    none: {
      on: {
        MAKE_LETTER: {
          service(event) {
            const [, setContext] = useContext();
            const [, setState] = useState();
            setState('letter');
            setContext({ letter: event.letter }); // {letter: 'Возмите меня на работу, рекомендации предоставляю по запросу'}
          },
        },
      },
    },
  },
});

const vacancyMachine = machine({
  id: 'vacancy',
  initialState: 'notResponded',
  context: { id: 123 },
  states: {
    responded: {
      onEntry: 'onStateEntry',
    },
    notResponded: {
      onExit() {
        console.log('we are leaving notResponded state');
      },
      on: {
        RESPOND: {
          service: event => {
            const [, setContext] = useContext();
            const [, setState] = useState();
            if (event.letter) {
              negotiationsMachine.transition('MAKE_LETTER', { letter: event.letter });
            }
            // window.fetch({ method: 'post', data: { resume: event.resume, vacancyId: context.id } }).then(() => {
              setState('responded');
              setContext({ completed: true }); // {id: 123, comleted: true}
            // });
          },
        },
      },
    },
  },
  actions: {
    onStateEntry(event) {
      const [state] = useState();
      console.log('now state is ' + state);
    },
  },
});

// Пример использования StateMachine
console.log(negotiationsMachine);
console.log(vacancyMachine);
vacancyMachine.transition('RESPOND', {
  resume: { name: 'Vasya', lastName: 'Pupkin' },
  letter: 'Возмите меня на работу, рекомендации предоставляю по запросу',
});
console.log(vacancyMachine);
console.log(negotiationsMachine);