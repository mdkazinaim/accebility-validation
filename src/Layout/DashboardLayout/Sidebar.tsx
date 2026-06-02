import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { adminRoutes } from "@/routes/AdminRoutes";
import { menuGenerator, MenuItem } from "@/utils/Generator/MenuGenerator";
import { Location } from "react-router-dom";
// Sub-component to handle recursive levels and isolated hover states
const NavItem = ({
  item,
  level,
  location,
}: {
  item: MenuItem;
  level: number;
  location: Location;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = !!item.children?.length;

  // Active route logic
  const isRouteActive = (item: MenuItem, currentPath: string): boolean => {
    if (!item.path) return false;

    // Exact match
    if (currentPath === item.path) return true;

    // Child route match (e.g., /team/projects/details matches /team/projects)
    if (currentPath.startsWith(item.path + "/")) return true;

    // Check children recursively
    if (item.children) {
      return item.children.some((child) => isRouteActive(child, currentPath));
    }

    return false;
  };

  const active = isRouteActive(item, location.pathname);

  const itemClasses = `flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200 no-underline!
    ${
      active
        ? "bg-secondary-brand text-white font-medium"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  const content = (
    <>
      {item.icon}
      <span className="flex-1 uppercase no-underline!">{item.label}</span>
      {hasChildren && (
        <span
          className={`text-[10px] transition-transform duration-200 ${
            isHovered ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      )}
    </>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Parent / Leaf Link */}
      {!item.path ? (
        <div className={`${itemClasses} cursor-default whitespace-nowrap`}>
          {content}
        </div>
      ) : (
        <NavLink
          to={item.path}
          className={`${itemClasses} cursor-pointer whitespace-nowrap`}
        >
          {content}
        </NavLink>
      )}

      {/* Sub-menu: Renders only if hovered AND has children */}
      {hasChildren && isHovered && (
        <div
          className="absolute left-full top-0 z-[100] pt-0 pl-2 animate-in fade-in slide-in-from-left-1 duration-150"
          style={{ marginLeft: "-2px" }} // Slight overlap to prevent hover-gap flicker
        >
          {/* Invisible bridge */}
          <div className="absolute -left-2 top-0 h-full w-2" />

          <div className="w-52 p-1 bg-primary-brand border border-white/10 shadow-2xl rounded-md">
            <div className="space-y-1">
              {item.children!.map((child) => (
                <NavItem
                  key={child.label + child.path}
                  item={child}
                  level={level + 1}
                  location={location}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const menu = menuGenerator(adminRoutes, "/admin");
  const location = useLocation();

  const groupedMenu = menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const group = item.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <aside className="w-64 h-screen bg-primary-brand text-white sticky top-0 z-40 flex flex-col">
      <div className="p-4 h-16 text-xl font-bold border-b border-white/10 flex items-center">
        <Link to="/" className="no-underline text-white">
          accessibility-validation
        </Link>
      </div>

      <nav className="p-2 space-y-4 flex-1 overflow-y-visible overflow-x-visible">
        {Object.entries(groupedMenu).map(([group, items]) => (
          <div key={group}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase text-white/40 tracking-widest">
              {group}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <NavItem
                  key={item.label + item.path}
                  item={item}
                  level={0}
                  location={location}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
