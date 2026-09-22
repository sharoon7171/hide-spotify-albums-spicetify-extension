declare namespace Spicetify {
  function showNotification(
    message: string,
    isError?: boolean,
    msTimeout?: number,
  ): void;

  const Platform: {
    History: {
      location: {
        pathname: string;
        search?: string;
        hash?: string;
        state?: unknown;
      };
      listen: (cb: (loc: { pathname: string }) => void) => () => void;
      push: (path: string) => void;
      replace: (
        path:
          | string
          | {
              pathname: string;
              search?: string;
              hash?: string;
              state?: unknown;
            },
      ) => void;
    };
  };

  const GraphQL: {
    Request?: (
      def: unknown,
      vars: Record<string, unknown>,
      options?: unknown,
    ) => Promise<unknown>;
    Definitions?: Record<string, unknown>;
  };

  const LocalStorage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };

  const Events: {
    webpackLoaded: { on: (cb: () => void) => void };
  };

  namespace PopupModal {
    interface Content {
      title: string;
      content: string | Element;
      isLarge?: boolean;
    }
    function display(options: Content): void;
    function hide(): void;
  }

  const SVGIcons: Record<string, string>;

  const Player: unknown;

  const React: {
    createElement: (
      type: unknown,
      props: Record<string, unknown> | null,
      ...children: unknown[]
    ) => unknown;
    useRef: <T>(value: T) => { current: T };
    useSyncExternalStore: <T>(
      subscribe: (onChange: () => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ) => T;
    jsx?: (type: unknown, props: unknown, key?: unknown) => unknown;
    jsxs?: (type: unknown, props: unknown, key?: unknown) => unknown;
  };
}
