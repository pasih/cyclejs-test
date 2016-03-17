import { div, h1, hr, input, legend, p, ul, li, a } from "@cycle/dom";
import Rx from 'rx';
import { curry } from 'ramda';

import { extractSubstreams } from './util/utils.js';
import LoginForm from './components/login';
import Home from './components/home';


// User is allowed to access the resource
const allow = curry((component, state$) => Rx.Observable.of(component));

// User must be authenticated or otherwise redirectTo will be rendered
const authenticate = curry((redirectTo, component, state$) => {
  return state$
    .map(state => state.loggedIn ? component : redirectTo);
});

// Helper to redirect to LoginForm
const authenticatedOrRedirect = authenticate(LoginForm);

// Routes annotated with access
const routes = {
  '/': authenticatedOrRedirect(Home),
  '/login': allow(LoginForm)
}


function NavigationBar(sources, path$) {
  const { router: { createHref }} = sources

  const homeHref = createHref('/');
  const loginHref = createHref('/login');

  const view$ = path$.map(() =>
    ul([
      li([ a({ href: homeHref }, 'Home') ]),
      li([ a({ href: loginHref }, 'Login') ])
    ])
  );

  return {
    DOM: view$
  };
}

// Decorate routes with authentication functions
function setupAuthentication(routes, state$) {
  return Object.keys(routes).reduce((prev, current) => {
    prev[current] = routes[current](state$);
    return prev;
  }, {});
}

function main(sources) {
  const state$ = Rx.Observable.of({ loggedIn: false }).share();

  const { router } = sources;
  const  match$ = router.define(setupAuthentication(routes, state$));
  const navigationBar = NavigationBar(sources, match$.pluck('path'));

  // children is a stream of components (i.e. we map over state on line 15/16)
  const children$ = match$.flatMapLatest(({path, value}) => {
    return value.map(component => {
      return component({...sources, router: router.path(path)}, state$);
    })
  }).share();

  // Testing the component directly
  // const child = LoginForm(sources);
  // console.log(child);

  // We extract DOM, HTTP and preventDefault from current child
  const child = extractSubstreams(children$, ['DOM', 'HTTP', 'preventDefault']);

  // DOM works, preventDefault (and presumably HTTP don't)
  const mainView$ = navigationBar.DOM.combineLatest(child.DOM,
    (navigationView, children) => {
      return div([
        navigationView,
        hr(),
        children,
        hr()
      ])
    });

  return {
    DOM: mainView$,
    HTTP: child.HTTP,
    preventDefault: child.preventDefault
  };
};

export default main;
