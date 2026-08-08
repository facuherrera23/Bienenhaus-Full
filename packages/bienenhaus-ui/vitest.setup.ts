// Must load preact/compat BEFORE @testing-library/preact: its fireEvent
// detects compat mode via a global `vnode.$$typeof` flag, and that detection
// only works when compat's hooks are already installed (otherwise it flips
// mid-suite and renames 'change' events to 'input', breaking select tests).
import 'preact/compat';
import '@testing-library/jest-dom';
