let pause;

export const throttle = (callback, time) => {
  // Don't run the function if pause is true.
  if (pause) return;

  // Set pause to true after the if condition. This allows the function to be run once.
  pause = true;
  // SetTimeout runs the callback within the specified time.
  setTimeout(() => {
    callback();
    // pause is set to false once the function has been called, allowing the throttle function to loop.
    pause = false;
  }, time);
};