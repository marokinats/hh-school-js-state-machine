const ht = new HashTable();

let hashKey;

class StateMachine {

  constructor(machineParams) {
    this.context = machineParams.context;
    this.context.id = machineParams.context.id;
    this.states = machineParams.states;
    this.actions = machineParams.actions;
    this.initialState = machineParams.initialState;
  }

  transition(transaction, event) {

    let currentState = this.states[this.initialState];

    this.stateAction(currentState, transaction, event);

  }

  stateAction(state, transaction, event) {

    for (const key in state) {

      if (typeof state[key] === 'function') {
        state[key]();
      }
      else if (typeof state[key] === 'string') {
        this.actions[state[key]]();
      }
      else if (Array.isArray(state[key])) {
        state[key].forEach(el => {
          this.actions[el]();
        });
      }

      if (state[key].hasOwnProperty(transaction)) {
        ht.setElement(String(this.context.id), this);
        hashKey = String(this.context.id);
       
        this.stateTransaction(event, state[key][transaction]);
      }
    }
  }

  stateTransaction(event, transaction) {
    if (transaction.service) {
      transaction.service(event);
    } else {
      const [state, setState] = useState();
      setState('responded');
    }
  }

}

function HashTable(size = 13) {
  const _store = [];
  const _size = size;

  function hash(string) {
    let index = 0;

    for (let i = 0; i < string.length; i++) {
      index += string.charCodeAt(i) * (i + 1);
    }

    return index % _size;
  }

  function findMatchingIndex(list, key) {
    for (let i = 0; i < list.length; i++) {
      if (list[i][0] === key) return i;
    }
  }

  return {
    _store,

    setElement(key, value) {
      const index = hash(key);

      if (!_store[index]) {
        _store[index] = [
          [key, value]
        ];
      }
      else {
        const list = _store[index];
        const matchingIndex = findMatchingIndex(list, key);

        if (matchingIndex) {
          list[matchingIndex] = [key, value];

          return;
        }

        list.push([key, value]);
      }
    },

    getElement(key) {
      const index = hash(key);

      if (_store[index]) {
        const list = _store[index];
        const matchingIndex = findMatchingIndex(list, key);

        if (matchingIndex != undefined) return list[matchingIndex][1];
      }
    }
  }
}

function useContext() {
  const machine = ht.getElement(hashKey);
  let currentContext = machine.context;

  setContext = (newContext) => {
    for (const key in newContext) {
      currentContext[key] = newContext[key];
    }
  }

  return [currentContext, setContext];
};

function useState() {
  const machine = ht.getElement(hashKey);

  setState = (newState) => {
    machine.initialState = newState;
    machine.stateAction(machine.states[machine.initialState]);
  }

  return [machine.initialState, setState];
};

const machine = function (machineParams) {

  return new StateMachine(machineParams);
};


// machine — создает инстанс state machine (фабрика)
const vacancyMachine = machine({
  // У каждого может быть свой id
  id: 'vacancy',
  // начальное состояние
  initialState: 'notResponded',
  // дополнительный контекст (payload)
  context: { id: 123 },
  // Граф состояний и переходов между ними
  states: {
    // Каждое поле — это возможное состоение
    responded: {
      // action, который нужно выполнить при входе в это состояние. Можно задавать массивом, строкой или функцией
      onEntry: 'onStateEntry'
    },
    notResponded: {
      // action, который нужно выполнить при выходе из этого состояния. Можно задавать массивом, строкой или функцией                         
      onExit() {
        console.log('we are leaving notResponded state');
      },
      // Блок описания транзакций
      on: {
        // Транзакция
        RESPOND: {
          // упрощенный сервис, вызываем при транзакции
          service: (event) => {
            // Позволяет получить текущий контекст и изменить его
            const [context, setContext] = useContext();
            // Позволяет получить текущий стейт и изменить его
            const [state, setState] = useState();
            // Поддерживаются асинхронные действия
            // window.fetch({ method: 'post', data: { resume: event.resume, vacancyId: context.id } }).then(() => {
            // меняем состояние
            setState('responded');
            // Мержим контекст
            setContext({ completed: true }); // {id: 123, comleted: true}
            // });
          }
          // Если не задан сервис, то просто переводим в заданный target, иначе выполняем сервис.
          // target: 'responded',
        }
      }
    },
  },
  // Раздел описание экшенов 
  actions: {
    onStateEntry: (event) => {
      const [state] = useState();
      console.log('now state is ' + state);
    }
		/*makeResponse: (event) => {
			// both sync and async actions
			const [contex, setContext] = useContext()			
			window.fetch({method: 'post', data: {resume: event.resume, vacancyId: context.id} })
		}*/
  }
})

// Пример использования StateMachine
console.log(vacancyMachine);
vacancyMachine.transition('RESPOND', { resume: { name: 'Vasya', lastName: 'Pupkin' } });
console.log(vacancyMachine);