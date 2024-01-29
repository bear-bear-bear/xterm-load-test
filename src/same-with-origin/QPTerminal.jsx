import React from 'react';
import debounce from 'lodash/debounce';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export default class QPTerminal extends React.Component {
  constructor(props) {
    super(props);
    this.terminalRef = React.createRef();
    this.fitAddon = new FitAddon();
    const alignTerminal = debounce(() => this.fitAddon.fit(), 50);
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length !== 1) {
        throw new Error('Invalid Container length');
      }
      alignTerminal();
    });
    // Bind Methods
    this.onBell = this.onBell.bind(this);
    this.onBinary = this.onBinary.bind(this);
    this.onCursorMove = this.onCursorMove.bind(this);
    this.onData = this.onData.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onLineFeed = this.onLineFeed.bind(this);
    this.onRender = this.onRender.bind(this);
    this.onWriteParsed = this.onWriteParsed.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onTitleChange = this.onTitleChange.bind(this);
    this.#setupTerminal();
  }

  #setupTerminal() {
    // Set up options
    const defaultOptions = {
      convertEol: true,
    };
    const options = (() => {
      if (!this.props.options) {
        return defaultOptions;
      }
      return { ...defaultOptions, ...this.props.options };
    })();
    // Set up the XTerm terminal.
    this.terminal = new Terminal(options);
    // Create Listeners
    this.terminal.onBell(this.onBell);
    this.terminal.onBinary(this.onBinary);
    this.terminal.onCursorMove(this.onCursorMove);
    this.terminal.onData(this.onData);
    this.terminal.onKey(this.onKey);
    this.terminal.onLineFeed(this.onLineFeed);
    this.terminal.onRender(this.onRender);
    this.terminal.onWriteParsed(this.onWriteParsed);
    this.terminal.onResize(this.onResize);
    this.terminal.onScroll(this.onScroll);
    this.terminal.onSelectionChange(this.onSelectionChange);
    this.terminal.onTitleChange(this.onTitleChange);
    // Add Custom Key Event Handler
    if (this.props.customKeyEventHandler) {
      this.terminal.attachCustomKeyEventHandler(this.props.customKeyEventHandler);
    }
  }

  componentDidMount() {
    if (this.terminalRef.current && this.terminal) {
      // Creates the terminal within the container element.
      this.terminal.open(this.terminalRef.current);
      this.terminal.loadAddon(this.fitAddon);
      this.fitAddon.fit();
      // Load addons if the prop exists.
      if (this.props.addons) {
        this.props.addons.forEach(addon => {
          this.terminal?.loadAddon(addon);
        });
      }
      this.resizeObserver.observe(this.terminalRef.current);
      this.props.onDidMount?.(this);
    }
  }

  componentWillUnmount() {
    // When the component unmounts dispose of the terminal and all of its listeners.
    this.terminal?.dispose();
    this.fitAddon.dispose();
    if (this.terminalRef.current) {
      this.resizeObserver.unobserve(this.terminalRef.current);
    }
  }

  onLineFeed() {
    this.props.onLineFeed?.();
  }

  onBinary(data) {
    this.props.onBinary?.(data);
  }

  onCursorMove() {
    this.props.onCursorMove?.();
  }

  onData(data) {
    this.props.onData?.(data);
  }

  onKey(event) {
    this.props.onKey?.(event);
  }

  onBell() {
    this.props.onBell?.();
  }

  onScroll(newPosition) {
    this.props.onScroll?.(newPosition);
  }

  onSelectionChange() {
    this.props.onSelectionChange?.();
  }

  onRender(event) {
    this.props.onRender?.(event);
  }

  onWriteParsed() {
    this.props.onWriteParsed?.();
  }

  onResize(event) {
    this.props.onResize?.(event);
  }

  onTitleChange(newTitle) {
    this.props.onTitleChange?.(newTitle);
  }

  appendMessage(values, callback) {
    for (const value of values) {
      this.terminal.writeln(value, callback);
    }
  }

  setMessage(values, options) {
    this.terminal.clear();
    this.appendMessage(values, options?.callback);
  }

  render() {
    return (
      <div
        className={this.props.className}
        style={{ overflow: 'hidden', ...this.props.style }}
        ref={this.terminalRef}
      />
    );
  }
}
