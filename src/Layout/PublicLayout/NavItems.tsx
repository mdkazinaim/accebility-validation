import { Link, useLocation } from "react-router-dom";
import { publicRoutes } from "@/routes/PublicRoutes";
import { menuGenerator, MenuItem } from "@/utils/Generator/MenuGenerator";
const NavItems = ({
  className,
  classNameNC,
  classNameC,
}: {
  className?: string;
  classNameNC?: string;
  classNameC?: string;
}) => {
  const location = useLocation();
  const navbarItems = menuGenerator(publicRoutes);

  // 🔹 Helper: check if a path is active or a parent of the active path
  const isPathActive = (path?: string, children?: MenuItem[]) => {
    if (!path) return false;

    // Exact match or nested match
    if (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    ) {
      return true;
    }

    // Any child active
    if (children?.length) {
      return children.some((child) =>
        child.path
          ? location.pathname === child.path ||
            location.pathname.startsWith(child.path + "/")
          : false,
      );
    }

    return false;
  };

  return (
    <nav className={className}>
      <ul className={`flex gap-4 ${className}`}>
        {navbarItems.map((item) => {
          const parentActive = isPathActive(item.path, item.children);

          return (
            <li key={item.path ?? item.label} className="relative group">
              {/* Parent item */}
              {item.path ? (
                <Link
                  to={item.path}
                  className={`px-5 py-2 text-white inline-block no-underline ${
                    parentActive ? "border-b-2" : ""
                  } ${classNameNC}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="px-5 py-2 text-white inline-block cursor-default">
                  {item.label}
                </span>
              )}

              {/* Dropdown */}
              {item.children && item.children.length > 0 && (
                <ul className="absolute left-0 top-full hidden min-w-[200px] rounded-lg bg-primary-brand shadow-lg group-hover:block">
                  {item.children.map((child) => {
                    const childActive =
                      child.path &&
                      (location.pathname === child.path ||
                        location.pathname.startsWith(child.path + "/"));

                    return (
                      <li key={child.path}>
                        <Link
                          to={child.path || "#"}
                          className={`block px-5 py-2 text-center text-white no-underline rounded-b-lg ${
                            childActive
                              ? "bg-secondary-brand border-b-2 font-semibold"
                              : ""
                          } ${classNameC}`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavItems;
