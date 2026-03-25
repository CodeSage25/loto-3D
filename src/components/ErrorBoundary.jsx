import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("3D Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-950 text-white p-8">
          <div className="text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="text-lg font-bold mb-2">Erreur de rendu 3D</h2>
            <p className="text-gray-400 text-sm mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-blue-600 rounded-full text-sm hover:bg-blue-700"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
