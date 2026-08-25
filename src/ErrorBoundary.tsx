import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || "Something went wrong." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("GenImage failed to render", error, info.componentStack);
  }

  render() {
    if (!this.state.message) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-[28px] border border-line bg-panel p-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">GenImage</p>
          <h1 className="mt-3 font-display text-3xl">Let’s reset this screen</h1>
          <p className="mt-3 text-sm text-muted">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-gold px-5 py-2.5 text-sm text-ink"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
