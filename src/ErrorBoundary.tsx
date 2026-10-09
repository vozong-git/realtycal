import { Component, type ReactNode } from 'react';

/** 예상 못 한 오류가 나도 흰 화면 대신 안내를 보여준다 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <div className="empty">
          <p>화면을 그리다 문제가 생겼어요.</p>
          <button className="primary" onClick={() => location.reload()}>
            새로고침
          </button>
        </div>
      </div>
    );
  }
}
