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
    state.filter((item) => item !== itemToRemove),
  UpdateKeyframeTime: (time) => (state) => time
};

const addKeyframeTimeAction$ = (event$) =>
  event$.pipe(
    map((event) => Operations.UpdateKeyframeTime(Number(event.target.value)))
  );
const removeKeyframeTimeAction$ = (event$) =>
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

    const removeKeyframeTime$ = stateFromAction$(
      removeKeyframeTimeAction$(
        event$.pipe(filter((e) => e.target.id === "remove-keyframe"))
      )
    );

    const addAction$ = (event$) =>
      event$.pipe(
        withLatestFrom(addKeyframeTime$),
        map(([, keyframeTime]) => Operations.AddItem(keyframeTime))
      );

    const removeAction$ = (event$) =>
      event$.pipe(
        withLatestFrom(removeKeyframeTime$),
        map(([, keyframeTime]) => Operations.RemoveItem(keyframeTime))
      );

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
        <input
          id="remove-keyframe"
          type="number"
          onChange={onAddRemovePlayClick}
        />
        <button onClick={onAddRemovePlayClick}>-</button>
      </div>
      <div>
        <button onClick={onAddRemovePlayClick}>play</button>
      </div>
      <h1>{keyframeState.join(" ")}</h1>
      <h1>{value}</h1>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App foo={100} />, rootElement);
