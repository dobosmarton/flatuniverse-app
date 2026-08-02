import { AppSidebar } from '@/components/sidebar';

export default function ArticlesLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-row">
      <AppSidebar />
      {props.children}
    </div>
  );
}
