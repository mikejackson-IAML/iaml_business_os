import { GlobalSearchModal } from './components/global-search-modal';

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalSearchModal />
    </>
  );
}
