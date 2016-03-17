import { div, h1, hr, input, legend, p } from "@cycle/dom";
import Rx from 'rx';

function HomeComponent() {
  return {
    DOM: Rx.Observable.of(
      div([
        h1('Home page'),
        p('Welcome')
      ])
    )
  };
}

export default HomeComponent
