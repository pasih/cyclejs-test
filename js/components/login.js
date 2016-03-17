import { form, input, div, legend, p, button } from '@cycle/dom';
import Rx from 'rx';

const LOGIN_URL = 'https://httpbin.org/basic-auth/foo/barbar';

function intent(sources) {
  const submit$ = sources.DOM.select('.login-form').events('submit');
  const usernameInput$ = sources.DOM.select('.js-username').events('input')
    .pluck('target', 'value');
  const passwordInput$ = sources.DOM.select('.js-password').events('input')
    .pluck('target', 'value');

  const inputValues$ = Rx.Observable.combineLatest(
   usernameInput$,
   passwordInput$,
   (user, pw) => ({ user, pw })
  );

  return {
    submit$,
    inputValues$,
    preventDefault$: submit$
  };
}

function model(HTTP, intent$) {
  const initialState = {
    initial: true,
    invalidFields: [],
    valid: false,
    processing: false,
    success: false // Just for demo, actually we would navigate elsewhere.
  };

  const valid$ = intent$.inputValues$.map(({ user, pw }) => state => {
    return Object.assign(state, {
      username: user,
      password: pw,
      valid: user.trim().length > 2 && pw.trim().length > 5
    });
  });

  const submit$ = intent$.submit$.map(() => state => {
    return Object.assign(state, { initial: false, processing: true });
  });

  const request$ = submit$
    .withLatestFrom(
      intent$.inputValues$.map(({ user, pw }) => ({ user, pw })),
      (submit, values) => {
        return {
          username: values.user,
          password: values.pw
        };
      }
    )
    .map(obj => {
      return {
        method: 'GET',
        url: LOGIN_URL,
        category: 'login_request',
        user: obj.username,
        password: obj.password
      };
    });

  const response$ = HTTP
    // .filter(res$ => res$.category === 'login_request')
    .flatMap(resp$ =>
      resp$
      .map(res => state => {
        return Object.assign(state, {
          processing: false,
          success: !res.error
        });
      })
      .catch(err => {
        return Rx.Observable.of(state => {
          return Object.assign(state, { error: true, processing: false });
        });
      })
    );

  const state$ = Rx.Observable.of(initialState)
    .concat(valid$.merge(submit$).merge(response$))
    .scan((state, modFn) => modFn(state));

  return {
    state$,
    HTTP: request$
  };
}

function view(state$) {
  return state$.map(state => {
    return div('.well', [
      legend('Login'),
      form('.login-form', [
        (state.success ? p('Sucessfully logged in') : p()),
        (!state.initial && !state.success && !state.processing ? p('Login failed') : p()),
        div('.form-group', [
          input({ type: 'text', name: 'username', className: 'js-username form-control' }),
        ]),
        div('.form-group', [
          input({ type: 'password', name: 'password', className: 'js-password form-control' }),
        ]),
        input({
          type: 'submit',
          disabled: !state.valid || state.processing,
          className: 'btn btn-primary',
          value: state.processing ? 'Please wait' : 'Login'
        })
      ])
    ]);
  });
}

function LoginForm(sources) {
  const intent$ = intent(sources);
  const model$ = model(sources.HTTP, intent$);
  const view$ = view(model$.state$);

  const sinks = {
    DOM: view$,
    HTTP: model$.HTTP,
    preventDefault: intent$.preventDefault$
  };

  return sinks;
}

export default LoginForm;
