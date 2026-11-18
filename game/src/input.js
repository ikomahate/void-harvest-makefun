// Keyboard and pointer controls; focus loss releases all held actions.
export function createInput(canvas, toLogical) {
  const keys = new Set(), actions = [];
  const pointer = { x: 950, y: 450, active: false, fire: false, mine: false };
  const handled = /^(Key[WASDEUPMH]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Space|Escape|Enter|Digit[1-4])$/;
  window.addEventListener('keydown', event => {
    if (!handled.test(event.code)) return;
    if (event.target instanceof HTMLButtonElement && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (!event.repeat && !event.target.disabled) event.target.click();
      return;
    }
    event.preventDefault(); keys.add(event.code);
    if (!event.repeat) actions.push(event.code);
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  canvas.addEventListener('pointermove', event => Object.assign(pointer, toLogical(event.clientX, event.clientY), { active: true }));
  canvas.addEventListener('pointerdown', event => {
    Object.assign(pointer, toLogical(event.clientX, event.clientY), { active: true });
    if (event.button === 0) pointer.fire = true;
    if (event.button === 2) pointer.mine = true;
  });
  window.addEventListener('pointerup', event => {
    if (event.button === 0) pointer.fire = false;
    if (event.button === 2) pointer.mine = false;
  });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  function clear() { keys.clear(); pointer.fire = false; pointer.mine = false; }
  window.addEventListener('blur', clear);
  return {
    pointer, clear,
    takeActions() { return actions.splice(0); },
    sample() {
      return {
        x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
        y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')),
        boost: keys.has('ShiftLeft') || keys.has('ShiftRight'),
        mine: keys.has('KeyE') || pointer.mine, fire: pointer.fire, pulse: keys.has('Space'), pointer,
      };
    },
  };
}
