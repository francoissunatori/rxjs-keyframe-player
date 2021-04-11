import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useEventCallback } from "rxjs-hooks";
import { from, merge, interval, zip } from "rxjs";
import {
  map,
  scan,
  filter,
  withLatestFrom,
  exhaustMap,
  tap
} from "rxjs/operators";

const Operations = {
  AddItem: (newItem) => (state) => state.concat(newItem),
  RemoveItem: (itemToRemove) => (state) =>
    state.filter((item) => item !== itemToRemove)
};

const addAction$ = (event$) =>
  event$.pipe(map((item) => Operations.AddItem(1)));
const removeAction$ = (event$) =>
  event$.pipe(map((item) => Operations.RemoveItem(1)));

const stateFromAction$ = (action$) =>
  action$.pipe(scan((state, action) => action(state), []));

function App() {
  const [keyframeState, setKeyframeState] = useState([]);

  const [onAddRemovePlayClick, value] = useEventCallback((event$) => {
    const keyframeState$ = stateFromAction$(
      merge(
        addAction$(event$.pipe(filter((e) => e.target.innerHTML === "+"))),
        removeAction$(event$.pipe(filter((e) => e.target.innerHTML === "-")))
      )
    ).pipe(tap(setKeyframeState));

    return event$.pipe(
      filter((e) => e.target.innerHTML === "play"),
      withLatestFrom(keyframeState$),
      exhaustMap(([, keyframeState]) =>
        zip(from(keyframeState), interval(500), (a) => a)
      )
    );
  });

  return (
    <>
      <h1>{value}</h1>
      <h1>{keyframeState.join(" ")}</h1>
      <button onClick={onAddRemovePlayClick}>+</button>
      <button onClick={onAddRemovePlayClick}>-</button>
      <button onClick={onAddRemovePlayClick}>play</button>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App foo={100} />, rootElement);
