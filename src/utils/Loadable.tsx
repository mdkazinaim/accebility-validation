import { Suspense, ComponentType } from "react";
import { PageSkeleton } from "@/common/Skeleton";

/**
 * Loadable HOC to wrap lazy-loaded components in a Suspense boundary.
 * Allows passing a custom fallback (skeleton) for specific pages.
 */
const Loadable = (Component: ComponentType, Fallback: ComponentType = PageSkeleton) => (props: any) => (
  <Suspense fallback={<Fallback />}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;
