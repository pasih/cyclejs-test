
// import 'babel-polyfill';
import Cycle from '@cycle/core';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import { makeRouterDriver } from 'cyclic-router';
import { createHashHistory } from 'history';


import main from './main';

const makePreventDefaultDriver = function () {
  return function (preventDefault$) {
    preventDefault$.subscribe(evt => {
      console.log('XXXXX');
      console.log(evt);
      evt.preventDefault();
    });
  };
};

const history = createHashHistory({ queryKey: false });

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  preventDefault: makePreventDefaultDriver(),
  router: makeRouterDriver(history)
};

Cycle.run(main, drivers);
