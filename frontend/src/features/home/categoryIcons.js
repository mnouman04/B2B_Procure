import {
  HardHat, Zap, Settings2, Container, Monitor, Truck, Building2, Package, Boxes,
} from 'lucide-react';

/** Maps the category `icon` slug stored in MongoDB onto a Lucide glyph. */
export const CATEGORY_ICONS = {
  construction: HardHat,
  zap: Zap,
  settings: Settings2,
  box: Container,
  monitor: Monitor,
  truck: Truck,
  building: Building2,
  package: Package,
  all: Boxes,
};
