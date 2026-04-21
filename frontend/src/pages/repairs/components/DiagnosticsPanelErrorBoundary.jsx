import React from 'react';

class DiagnosticsPanelErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        // Keep logs in dev tools to diagnose rendering issues without crashing the whole page.
        // eslint-disable-next-line no-console
        console.error('Diagnostics panel crashed:', error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || null;
        }

        return this.props.children;
    }
}

export default DiagnosticsPanelErrorBoundary;
