/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/breadcrumbUtils.ts
export const flattenRoutes = (routes: any[], base = "") => {
  let map: Record<string, { name: string; icon?: React.ReactNode }> = {};

  routes.forEach((group) => {
    group.items.forEach((item: any) => {
      const fullPath = `${base}/${item.path}`.replace(/\/+/g, "/");
      // Store name and icon
      map[fullPath] = { name: item.name, icon: item.icon };

      if (item.children) {
        const nested = flattenNested(item.children, fullPath);
        map = { ...map, ...nested };
      }
    });
  });

  return map;
};

const flattenNested = (children: any[], parentPath: string) => {
  let map: Record<string, { name: string; icon?: React.ReactNode }> = {};
  children.forEach((child) => {
    const fullPath = `${parentPath}/${child.path}`.replace(/\/+/g, "/");
    map[fullPath] = { name: child.name, icon: child.icon };
    if (child.children) {
      map = { ...map, ...flattenNested(child.children, fullPath) };
    }
  });
  return map;
};
