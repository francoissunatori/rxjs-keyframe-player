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
    state.filter((item, i) => i !== itemToRemove),
  UpdateKeyframeTime: (time) => (state) => time
};

const addKeyframeTimeAction$ = (event$) =>
  event$.pipe(
    map((event) => Operations.UpdateKeyframeTime(Number(event.target.value)))
  );

const stateFromAction$ = (action$) =>
  action$.pipe(scan((state, action) => action(state), []));

function App() {
  const [keyframeState, setKeyframeState] = useState([]);

  const [onAddRemovePlayClick, value] = useEventCallback((event$) => {
    const addKeyframeTime$ = stateFromAction$(
      addKeyframeTimeAction$(
        event$.pipe(filter((e) => e.target.id === "add-keyframe"))
      )
    );

    const addAction$ = (event$) =>
      event$.pipe(
        withLatestFrom(addKeyframeTime$),
        map(([, keyframeTime]) => Operations.AddItem(keyframeTime))
      );

    const removeAction$ = (event$) =>
      event$.pipe(map((e) => Operations.RemoveItem(parseInt(e.target.id))));

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
      <div>
        <input
          id="add-keyframe"
          type="number"
          onChange={onAddRemovePlayClick}
        />
        <button onClick={onAddRemovePlayClick}>+</button>
      </div>
      <div>
        <button onClick={onAddRemovePlayClick}>play</button>
      </div>
      {keyframeState.map((keyframe, i) => (
        <>
          <h1>{keyframe}</h1>
          <button id={i} key={i} onClick={onAddRemovePlayClick}>
            -
          </button>
        </>
      ))}
      <h1>{value}</h1>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App foo={100} />, rootElement);
