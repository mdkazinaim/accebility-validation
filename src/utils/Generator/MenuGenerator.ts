import { JSX } from "react";

export type MenuItem = {
  group?: string;
  label: string;
  path?: string;
  icon?: JSX.Element;
  children?: MenuItem[];
};

export type RouteItem = {
  path?: string;
  element?: JSX.Element;
  children?: RouteItem[];
  icon?: JSX.Element;
  name?: string;
  label?: string;
  index?: boolean;
};

export type RouteGroup =
  | {
      group?: string;
      items?: RouteItem[];
    }
  | RouteItem;

export const menuGenerator = (
  routes: RouteGroup[],
  parentPath = ""
): MenuItem[] => {
  return routes.flatMap((route) => {
    // Group with items
    if ("items" in route && Array.isArray(route.items)) {
      return route.items
        .map((item) => menuGenerator([item], parentPath))
        .flat()
        .map((child) => ({
          group: route.group,
          ...child,
        }));
    }

    // RouteItem
    const routeItem = route as RouteItem;

    // Skip if no name or label (route exists but won't show in sidebar)
    if (!routeItem.name && !routeItem.label) {
      return [];
    }

    // Skip if no element and no children
    if (!routeItem.element && !routeItem.children?.length) {
      return [];
    }

    const routePath = routeItem.path
      ? routeItem.path.startsWith("/")
        ? routeItem.path
        : `${parentPath}/${routeItem.path}`
      : undefined;

    const label = routeItem.label ?? routeItem.name ?? routeItem.path ?? "Home";

    const children = routeItem.children
      ? menuGenerator(routeItem.children, routePath)
      : undefined;

    // Skip if no element and children is empty
    if (!routeItem.element && (!children || children.length === 0)) {
      return [];
    }

    const item: MenuItem = {
      label,
      path: routePath,
      icon: routeItem.icon,
      children: children?.length ? children : undefined,
    };

    return [item];
  });
};
