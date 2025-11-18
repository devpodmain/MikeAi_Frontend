import { useLocation } from 'wouter';

export function useCurrentRoute() {
  const [location] = useLocation();
  return location;
}