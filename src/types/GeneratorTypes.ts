import { ReactNode } from "react";

export interface RouteTypes {
    icon?:ReactNode,
    label?:string,
    path?:string,
    element?:ReactNode,
    children?: RouteTypes[]
}

export interface SidebarItem {
  icon?: ReactNode;
  name: string;
  path: string;
  element: ReactNode;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}
