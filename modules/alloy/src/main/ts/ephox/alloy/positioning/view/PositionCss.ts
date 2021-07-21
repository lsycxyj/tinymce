import { Arr, Strings, Optional, Optionals, Type, Singleton, Thunk, Obj } from '@ephox/katamari';
import { Classes, Css, DomEvent, EventArgs, SugarElement } from '@ephox/sugar';

import * as Placement from '../layout/Placement';

export interface PositionCss {
  readonly position: string;
  readonly left: Optional<string>;
  readonly top: Optional<string>;
  readonly right: Optional<string>;
  readonly bottom: Optional<string>;
}

type Position = 'top' | 'left' | 'bottom' | 'right';

export interface Transition {
  readonly classes: string[];
  readonly properties: Position[];
}

const NuPositionCss = (
  position: string,
  left: Optional<number>,
  top: Optional<number>,
  right: Optional<number>,
  bottom: Optional<number>
): PositionCss => {
  const toPx = (num: number) => num + 'px';
  return {
    position,
    left: left.map(toPx),
    top: top.map(toPx),
    right: right.map(toPx),
    bottom: bottom.map(toPx)
  };
};

const toOptions = (position: PositionCss): Record<string, Optional<string>> => ({
  ...position,
  position: Optional.some(position.position)
});

const applyPositionCss = (element: SugarElement, position: PositionCss): void => {
  Css.setOptions(element, toOptions(position));
  Css.reflow(element);
};

const shouldTransition = (element: SugarElement<HTMLElement>, _transition: Transition): boolean => {
  // Don't apply transitions if there was no previous placement as it's transitioning from offscreen
  return Placement.getPlacement(element).isSome();
};

const hasChanges = (position: PositionCss, intermediate: Record<Position, Optional<string>>): boolean => {
  // Round to 3 decimal points
  const round = (value: string) => parseFloat(value).toPrecision(3);

  return Obj.find(intermediate, (value, key) => {
    const newValue = position[key as Position].map(round);
    const val = value.map(round);
    return !Optionals.equals(newValue, val);
  }).isSome();
};

const getTransitionDuration = (element: SugarElement<HTMLElement>): number => {
  const duration = Css.get(element, 'transition-duration');
  return Arr.foldl(duration.split(/\s*,\s*'/), (acc, dur) => {
    const d = parseFloat(dur);
    const time = Strings.endsWith(dur, 's') ? d * 1000 : d;
    return Math.max(acc, time);
  }, 0);
};

const setupTransitionListeners = (element: SugarElement<HTMLElement>, transition: Transition) => {
  const transitionEnd = Singleton.unbindable();
  const transitionCancel = Singleton.unbindable();

  const transitionDone = (e?: EventArgs<TransitionEvent>) => {
    const pseudoElement = e?.raw.pseudoElement;
    // Don't clean up if the pseudo element was the cause of the transitionend
    if (Type.isNullable(pseudoElement) || Strings.isEmpty(pseudoElement)) {
      transitionEnd.clear();
      transitionCancel.clear();
      transitionStart.unbind();
      clearTimeout(timer);

      // Only cleanup the class on transitionend not on a cancel
      // as cancel means something else triggered a new transition
      const type = e?.raw.type;
      if (Type.isNullable(type) || type === 'transitionend') {
        Classes.remove(element, transition.classes);
      }
    }
  };

  // When the transition starts listen for the relevant end event to cleanup
  const transitionStart = DomEvent.bind(element, 'transitionrun', Thunk.cached(() => {
    transitionEnd.set(DomEvent.bind(element, 'transitionend', transitionDone));
    transitionCancel.set(DomEvent.bind(element, 'transitioncancel', transitionDone));
  }));

  // Ensure the transition is cleaned up (add 10ms to give time for the transitionend to fire)
  const duration = getTransitionDuration(element);
  const timer = setTimeout(transitionDone, duration + 10);
};

const applyTransitionCss = (element: SugarElement<HTMLElement>, position: PositionCss, transition: Transition): void => {
  if (shouldTransition(element, transition)) {
    // Set the new position first so we can calculate the computed position
    Css.set(element, 'position', position.position);

    // Get the computed positions for the current location based on the new styles being applied
    const intermediateCssOptions = Arr.mapToObject(transition.properties, (prop) => position[prop].map(() => Css.get(element, prop)));

    // Apply the intermediate styles and transition classes if something has changed
    if (hasChanges(position, intermediateCssOptions)) {
      // Apply the intermediate styles and class to trigger the transition
      Css.setOptions(element, intermediateCssOptions);
      Classes.add(element, transition.classes);
      setupTransitionListeners(element, transition);
      Css.reflow(element);
    }
  } else {
    Classes.remove(element, transition.classes);
  }
};

export {
  NuPositionCss,
  applyPositionCss,
  applyTransitionCss
};
